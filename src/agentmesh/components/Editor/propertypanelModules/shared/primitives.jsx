import React, { useState, useEffect, useRef, memo, useMemo } from 'react';
import { FiInfo, FiZap, FiDatabase } from 'react-icons/fi';
import { useRunStore, useWorkflowStore } from '../../../../store';

export const FONT = "'Google Sans','Roboto',sans-serif";

export const PROVIDERS = [
  'groq', 'openai', 'anthropic', 'google', 'ollama', 'together', 'mistral', 'huggingface',
  'deepseek', 'cohere', 'perplexity', 'openrouter', 'azure', 'bedrock', 'vllm'
];

export const MODELS = {
  groq: [
    'openai/gpt-oss-120b',
    'meta-llama/llama-4-scout-17b-16e-instruct',
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'qwen/qwen3-32b',
    'moonshotai/kimi-k2-instruct-0905',
    'openai/gpt-oss-20b'
  ],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1-preview', 'o1-mini'],
  anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307', 'claude-opus-4'],
  google: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  ollama: ['gemma3:1b', 'granite4:1b', 'deepseek-coder-v2:16b', 'qwen2.5:7b', 'gemma4:e2b'],
};

export const inputStyle = {
  width: '100%', padding: '9px 12px', background: 'white',
  border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)',
  fontSize: 13, outline: 'none', fontFamily: FONT, transition: 'border-color 0.15s',
  boxSizing: 'border-box',
};

// Reusable hook to fetch all variables from runtime context and state
const useAvailableKeys = () => {
  const latestContext = useRunStore(s => s.latestContext) || {};
  const workflowNodes = useWorkflowStore(s => s.nodes) || {};
  const nodeLabelMap = useMemo(() => Object.fromEntries(workflowNodes.map(n => [n.id, n.data?.label || n.id])), [workflowNodes]);

  return useMemo(() => {
    const list = [];
    
    // Add system vars
    ['thread_id', 'workflow_id', 'user_id', 'msg'].forEach(k => {
      if (latestContext[k] !== undefined) {
        list.push({ label: `System: ${k}`, value: `{{${k}}}` });
      }
    });

    // Add node variables
    if (latestContext.nodes) {
      Object.keys(latestContext.nodes).forEach(nodeId => {
        const label = nodeLabelMap[nodeId] || nodeId;
        const nodeData = latestContext.nodes[nodeId];
        if (nodeData && typeof nodeData === 'object') {
          Object.keys(nodeData).forEach(k => {
            list.push({
              label: `${label}: ${k}`,
              value: `{{nodes.${nodeId}.${k}}}`
            });
          });
        }
      });
    }

    // Add general variables
    Object.keys(latestContext).forEach(k => {
      if (!['nodes', 'thread_id', 'workflow_id', 'workflow_name', 'user_id', 'msg'].includes(k)) {
        list.push({ label: `Context: ${k}`, value: `{{${k}}}` });
      }
    });

    return list;
  }, [latestContext, nodeLabelMap]);
};

export const Field = memo(function Field({ label, hint, action, children }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-semibold text-[var(--text-muted)]">{label}</label>
          {hint && (
            <div
              className="relative flex items-center cursor-help"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <FiInfo size={11} className="text-[var(--text-muted)] opacity-60" />
              {showTooltip && (
                <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 bg-[var(--text-primary)] text-white p-1.5 rounded-md text-[10px] w-[180px] leading-normal z-[1000] shadow-lg pointer-events-none text-center">
                  {hint}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-[var(--text-primary)]" />
                </div>
              )}
            </div>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
});

export const Input = memo(function Input({ value, onChange, placeholder, type = 'text', style: extra, disabled, debounceMs, noVariablePicker = false }) {
  const [localValue, setLocalValue] = useState(value ?? '');
  const [showPicker, setShowPicker] = useState(false);
  const dropdownRef = useRef(null);
  const timeoutRef = useRef(null);
  const availableKeys = useAvailableKeys();

  useEffect(() => {
    setLocalValue(value ?? '');
  }, [value]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!showPicker) return;
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showPicker]);

  const onDragOver = (e) => {
    if (e.dataTransfer.types.includes('application/agentmesh-var') || e.dataTransfer.types.includes('application/agentmesh-variable')) {
      e.preventDefault();
    }
  };
  const onDrop = (e) => {
    let text = e.dataTransfer.getData('application/agentmesh-var');
    if (!text) {
      const rawVar = e.dataTransfer.getData('application/agentmesh-variable');
      if (rawVar) text = `{{${rawVar}}}`;
    }
    if (text) {
      e.preventDefault();
      const newVal = (localValue || '') + text;
      setLocalValue(newVal);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      onChange(newVal);
    }
  };

  const handleChange = (val) => {
    setLocalValue(val);
    if (debounceMs) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        onChange(val);
      }, debounceMs);
    } else {
      onChange(val);
    }
  };

  const handleBlur = () => {
    if (debounceMs && localValue !== (value ?? '')) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      onChange(localValue);
    }
  };

  return (
    <div className="relative w-full flex items-center">
      <input
        type={type}
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        onDragOver={onDragOver}
        onDrop={onDrop}
        disabled={disabled}
        className={`w-full pl-3 pr-8 py-2 bg-white border border-[var(--border)] rounded-lg text-[13px] outline-none text-[var(--text-primary)] transition-colors duration-150 box-border disabled:opacity-60 focus:border-[var(--accent-btn)]`}
        style={{ fontFamily: FONT, ...extra }}
      />
      {!disabled && !noVariablePicker && availableKeys.length > 0 && (
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className="absolute right-2 bg-transparent border-none text-[var(--text-muted)] cursor-pointer hover:text-[var(--theme-primary)] flex items-center justify-center p-1"
          style={{ outline: 'none' }}
          title="Insert Variable"
        >
          <span style={{ fontSize: 13, fontWeight: 'bold', fontFamily: 'monospace' }}>{`{}`}</span>
        </button>
      )}

      {showPicker && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-[calc(100%+4px)] bg-white border border-[var(--border)] rounded-lg shadow-lg max-h-48 overflow-y-auto z-[9999] min-w-[220px]"
        >
          <div className="px-3 py-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase border-b border-[var(--border)] select-none">
            Insert Variable
          </div>
          {availableKeys.map(k => (
            <button
              key={k.value}
              type="button"
              onClick={() => {
                const newVal = (localValue || '') + k.value;
                setLocalValue(newVal);
                onChange(newVal);
                setShowPicker(false);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-[var(--bg-hover,rgba(0,0,0,0.03))] text-[11px] text-[var(--text-primary)] border-none bg-transparent cursor-pointer truncate font-mono"
            >
              {k.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

export const Textarea = memo(function Textarea({ value, onChange, placeholder, rows = 4, disabled, style: extra, debounceMs, noVariablePicker = false }) {
  const [localValue, setLocalValue] = useState(value ?? '');
  const [showPicker, setShowPicker] = useState(false);
  const dropdownRef = useRef(null);
  const timeoutRef = useRef(null);
  const availableKeys = useAvailableKeys();

  useEffect(() => {
    setLocalValue(value ?? '');
  }, [value]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!showPicker) return;
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showPicker]);

  const onDragOver = (e) => {
    if (e.dataTransfer.types.includes('application/agentmesh-var') || e.dataTransfer.types.includes('application/agentmesh-variable')) {
      e.preventDefault();
    }
  };
  const onDrop = (e) => {
    let text = e.dataTransfer.getData('application/agentmesh-var');
    if (!text) {
      const rawVar = e.dataTransfer.getData('application/agentmesh-variable');
      if (rawVar) text = `{{${rawVar}}}`;
    }
    if (text) {
      e.preventDefault();
      const newVal = (localValue || '') + text;
      setLocalValue(newVal);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      onChange(newVal);
    }
  };

  const handleChange = (val) => {
    setLocalValue(val);
    if (debounceMs) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        onChange(val);
      }, debounceMs);
    } else {
      onChange(val);
    }
  };

  const handleBlur = () => {
    if (debounceMs && localValue !== (value ?? '')) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      onChange(localValue);
    }
  };

  return (
    <div className="relative w-full flex items-start">
      <textarea
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        rows={rows}
        onDragOver={onDragOver}
        onDrop={onDrop}
        disabled={disabled}
        className={`w-full pl-3 pr-8 py-2 bg-white border border-[var(--border)] rounded-lg text-[13px] outline-none text-[var(--text-primary)] transition-colors duration-150 box-border resize-y leading-relaxed disabled:opacity-60 focus:border-[var(--accent-btn)]`}
        style={{ fontFamily: FONT, ...extra }}
      />
      {!disabled && !noVariablePicker && availableKeys.length > 0 && (
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className="absolute right-2 top-2 bg-transparent border-none text-[var(--text-muted)] cursor-pointer hover:text-[var(--theme-primary)] flex items-center justify-center p-1"
          style={{ outline: 'none' }}
          title="Insert Variable"
        >
          <span style={{ fontSize: 13, fontWeight: 'bold', fontFamily: 'monospace' }}>{`{}`}</span>
        </button>
      )}

      {showPicker && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-[calc(100%+4px)] bg-white border border-[var(--border)] rounded-lg shadow-lg max-h-48 overflow-y-auto z-[9999] min-w-[220px]"
        >
          <div className="px-3 py-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase border-b border-[var(--border)] select-none">
            Insert Variable
          </div>
          {availableKeys.map(k => (
            <button
              key={k.value}
              type="button"
              onClick={() => {
                const newVal = (localValue || '') + k.value;
                setLocalValue(newVal);
                onChange(newVal);
                setShowPicker(false);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-[var(--bg-hover,rgba(0,0,0,0.03))] text-[11px] text-[var(--text-primary)] border-none bg-transparent cursor-pointer truncate font-mono"
            >
              {k.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

export const CommaArrayEditor = memo(function CommaArrayEditor({ value = [], onChange, placeholder, isTextarea = false, rows = 3, style }) {
  const [localValue, setLocalValue] = useState((value || []).join(', '));

  useEffect(() => {
    const valArr = (value || []).filter(Boolean);
    const localArr = localValue.split(',').map(s => s.trim()).filter(Boolean);
    if (localArr.join(',') !== valArr.join(',')) {
      setLocalValue(valArr.join(', '));
    }
  }, [value, localValue]);

  const handleChange = (v) => {
    setLocalValue(v);
    onChange(v.split(',').map(s => s.trim()).filter(Boolean));
  };

  if (isTextarea) {
    return <Textarea value={localValue} onChange={handleChange} placeholder={placeholder} rows={rows} />;
  }
  return <Input value={localValue} onChange={handleChange} placeholder={placeholder} style={style} />;
});

export const VariablePicker = memo(function VariablePicker({ onSelect }) {
  const vars = [
    { label: 'Workflow Name', value: '{{workflow_name}}' },
    { label: 'Thread ID', value: '{{thread_id}}' },
    { label: 'Workflow ID', value: '{{workflow_id}}' },
  ];

  return (
    <div className="mb-3">
      <label className="text-[10px] font-extrabold text-[var(--text-muted)] mb-2 block uppercase tracking-wider">
        Click or Drag tags to insert
      </label>
      <div className="flex flex-wrap gap-1.5">
        {vars.map(v => (
          <div
            key={v.value}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('application/agentmesh-var', v.value)}
            onClick={() => onSelect(v.value)}
            title="Click to append or Drag into field"
            className="px-2.5 py-1 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-full text-[11px] cursor-pointer flex items-center gap-1.5 transition-all duration-150 select-none font-semibold hover:border-[var(--theme-primary)] hover:shadow-[0_0_10px_var(--theme-primary-glow)]"
          >
            <FiZap size={10} className="text-[var(--accent-btn)]" /> {v.label}
          </div>
        ))}
      </div>
    </div>
  );
});

export const Select = memo(function Select({ value, onChange, options, disabled }) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full px-3 py-2 bg-white border border-[var(--border)] rounded-lg text-[13px] outline-none text-[var(--text-primary)] transition-colors duration-150 box-border disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer`}
      style={{ fontFamily: FONT }}
    >
      {options.map((o) => (
        <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
          {typeof o === 'string' ? o : o.label}
        </option>
      ))}
    </select>
  );
});

export const Toggle = memo(function Toggle({ checked, onChange, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', width: '100%' }}>
      {label && <span style={{ fontSize: '13px', color: 'var(--text-secondary, #475569)', fontWeight: 600 }}>{label}</span>}
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: '36px',
          height: '20px',
          borderRadius: '9999px',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background-color 0.2s',
          flexShrink: 0,
          backgroundColor: checked ? 'var(--accent-btn, #7C3AED)' : '#E2E8F0'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '2px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: 'white',
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            left: checked ? '18px' : '2px'
          }}
        />
      </div>
    </div>
  );
});

export const HitlConfigSection = memo(function HitlConfigSection({ data, update }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <Toggle
          checked={data.interrupt_before === true}
          onChange={(v) => update({ interrupt_before: v })}
          label="Pause Before Execution"
        />
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, marginLeft: 28 }}>
          Pause the workflow run before this node starts processing.
        </div>
      </div>

      <div>
        <Toggle
          checked={data.interrupt_after === true}
          onChange={(v) => update({ interrupt_after: v })}
          label="Pause After Completion"
        />
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, marginLeft: 28 }}>
          Pause the workflow run after this node completes processing, waiting for human action.
        </div>
      </div>

      {(data.interrupt_before || data.interrupt_after) && (
        <div style={{ padding: 12, background: 'var(--bg-hover, #F8FAFC)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Allowed Actions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['approve', 'rework', 'reject'].map(action => {
              const actions = data.hitl_actions || ['approve', 'rework', 'reject'];
              const isChecked = actions.includes(action);
              return (
                <label key={action} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, cursor: 'pointer', color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    style={{ cursor: 'pointer' }}
                    onChange={(e) => {
                      const newActions = e.target.checked
                        ? [...new Set([...actions, action])]
                        : actions.filter(a => a !== action);
                      update({ hitl_actions: newActions });
                    }}
                  />
                  <span style={{ textTransform: 'capitalize' }}>{action}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ marginTop: 4 }}>
        <Toggle
          checked={data.mute_chat_bubble === true}
          onChange={(v) => update({ mute_chat_bubble: v })}
          label="Mute Chat Bubble"
        />
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, marginLeft: 28 }}>
          Do not show execution data or chat bubbles for this node in the chat view (useful for internal/sensitive utility flows).
        </div>
      </div>
    </div>
  );
});

export const MiniatureToggle = memo(function MiniatureToggle({ checked, onChange }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={`w-7 h-4 rounded-full cursor-pointer relative transition-all duration-200 shrink-0 ${checked ? 'bg-[var(--theme-primary,#8B5CF6)]' : 'bg-slate-200'}`}
    >
      <div
        className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-200 shadow"
        style={{ left: checked ? 14 : 2 }}
      />
    </div>
  );
});
