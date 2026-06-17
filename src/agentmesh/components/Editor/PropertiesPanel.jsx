import React, { useState, useEffect, useRef } from 'react';
import { useWorkflowStore, useUIStore, useVariablesStore, useRunStore } from '../../store';
import { listTools, fixGrammar, listAvailableModels, testConnection, chatArchitect } from '../../api/agentmesh';
import SkillGallery from './SkillGallery';
import SaveTemplateModal from './SaveTemplateModal';
import { FiMinus, FiTrash2, FiMousePointer, FiInfo, FiLayers, FiSettings, FiCpu, FiTool, FiGitMerge, FiTarget, FiShare2, FiUser, FiBookOpen, FiLink, FiPlus, FiX, FiGlobe, FiClock, FiCopy, FiCheck, FiSearch, FiChevronDown, FiRepeat, FiFileText, FiZap, FiLoader, FiAlertTriangle, FiGitBranch, FiActivity, FiEdit, FiFilter, FiShield, FiCamera, FiBox, FiSave, FiTerminal, FiDatabase, FiUploadCloud, FiDownload, FiAlignLeft, FiKey, FiLock, FiMessageSquare, FiPlay, FiHelpCircle, FiCode, FiSliders, FiInbox } from 'react-icons/fi';
import ConnectionsDropdown from './ConnectionsDropdown';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import jsonLang from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import toast from 'react-hot-toast';

function VariableLinker({ targetType, onSelect, tooltip }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pickerVar, setPickerVar] = useState(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [checkedKeys, setCheckedKeys] = useState(new Set());
  const { variables } = useVariablesStore();
  const containerRef = useRef(null);
  
  const relevantVars = variables.filter(v => Array.isArray(targetType) ? targetType.includes(v.var_type) : v.var_type === targetType);

  // Close on outside click
  // Close dropdown on outside click (picker modal has its own backdrop)
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleVarClick = (v) => {
    // Show checkbox picker only for arrays of primitive strings (like json_keys with 67 key paths)
    // schema_list has array of objects ({name, description}) — those should use direct select
    const isStringArray = Array.isArray(v.value) && v.value.length > 1 && typeof v.value[0] === 'string';
    if (isStringArray) {
      setPickerVar(v);
      setPickerSearch('');
      setCheckedKeys(new Set());
      setIsOpen(false);
    } else {
      // For schema_list, list of objects, or single-value vars → direct select
      onSelect(v);
      setIsOpen(false);
    }
  };

  const toggleKey = (key) => {
    setCheckedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleAddSelected = () => {
    if (checkedKeys.size === 0) return;
    // Create a synthetic variable with only the selected keys
    onSelect({ ...pickerVar, value: Array.from(checkedKeys) });
    setPickerVar(null);
    setPickerSearch('');
    setCheckedKeys(new Set());
  };

  const filteredKeys = pickerVar
    ? pickerVar.value.filter(k => String(k).toLowerCase().includes(pickerSearch.toLowerCase()))
    : [];

  const handleSelectAll = () => {
    if (checkedKeys.size === filteredKeys.length) {
      // Deselect all visible
      setCheckedKeys(prev => {
        const next = new Set(prev);
        filteredKeys.forEach(k => next.delete(k));
        return next;
      });
    } else {
      // Select all visible
      setCheckedKeys(prev => {
        const next = new Set(prev);
        filteredKeys.forEach(k => next.add(k));
        return next;
      });
    }
  };
  
  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={containerRef}>
      <button 
        type="button"
        title={tooltip || "Link to variable"}
        onClick={(e) => { e.preventDefault(); setIsOpen(!isOpen); setPickerVar(null); }}
        style={{
          background: 'none', border: 'none', padding: '4px', cursor: 'pointer',
          color: 'var(--accent-btn, #3b82f6)', display: 'flex', alignItems: 'center'
        }}
      >
        <FiZap size={14} />
      </button>
      
      {/* Step 1: Variable selector dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, zIndex: 100,
          background: 'white', border: '1px solid var(--border)', borderRadius: 8,
          boxShadow: 'var(--shadow-md)', minWidth: 200, padding: 8, marginTop: 4
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, padding: '0 4px' }}>
            Variables ({Array.isArray(targetType) ? targetType.join(', ') : targetType})
          </div>
          {relevantVars.length === 0 ? (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '4px', fontStyle: 'italic' }}>No variables found</div>
          ) : (
            <div style={{ maxHeight: 150, overflowY: 'auto' }}>
              {relevantVars.map(v => (
                <div 
                  key={v.key}
                  onClick={() => handleVarClick(v)}
                  style={{
                    padding: '6px 8px', fontSize: 12, cursor: 'pointer',
                    borderRadius: 4, fontFamily: 'monospace',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span>{v.key}</span>
                  {Array.isArray(v.value) && v.value.length > 1 && (
                    <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600 }}>{v.value.length} items</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Key picker with checkboxes (for array variables like json_keys) */}
      {pickerVar && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          zIndex: 10001, background: 'white', borderRadius: 16,
          boxShadow: '0 25px 60px rgba(0,0,0,0.25)', width: 640, maxWidth: '90vw', maxHeight: '70vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          border: '1px solid var(--border, #e2e8f0)',
          fontFamily: "'Google Sans','Roboto',sans-serif",
        }}>
          {/* Header */}
          <div style={{ 
            padding: '16px 20px', borderBottom: '1px solid var(--border, #e2e8f0)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: '#FAFBFC'
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
                Select Keys from <code style={{ background: '#EEF2FF', padding: '2px 6px', borderRadius: 4, fontSize: 12, color: '#4338CA' }}>{pickerVar.key}</code>
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                {checkedKeys.size} of {pickerVar.value.length} selected
              </div>
            </div>
            <button 
              onClick={() => { setPickerVar(null); setPickerSearch(''); setCheckedKeys(new Set()); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Search + Select All */}
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={13} />
              <input
                value={pickerSearch}
                onChange={e => setPickerSearch(e.target.value)}
                placeholder={`Search ${pickerVar.value.length} keys...`}
                autoFocus
                style={{
                  width: '100%', padding: '8px 10px 8px 32px', borderRadius: 8,
                  border: '1px solid var(--border, #e2e8f0)', outline: 'none',
                  fontSize: 12, color: 'var(--text-primary)', background: 'white',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              onClick={handleSelectAll}
              style={{
                border: '1px solid var(--border, #e2e8f0)', background: 'white',
                padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
                fontSize: 11, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap',
              }}
            >
              {checkedKeys.size === filteredKeys.length && filteredKeys.length > 0 ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {/* Key list with checkboxes */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 12px' }}>
            {filteredKeys.map((key, i) => {
              const isChecked = checkedKeys.has(key);
              return (
                <label
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px',
                    borderRadius: 6, cursor: 'pointer', fontSize: 12, fontFamily: 'monospace',
                    color: isChecked ? '#1e293b' : '#64748b',
                    background: isChecked ? '#EEF2FF' : 'transparent',
                    transition: 'background 0.1s',
                    borderBottom: i < filteredKeys.length - 1 ? '1px solid #f8fafc' : 'none',
                  }}
                  onMouseEnter={e => { if (!isChecked) e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={e => { if (!isChecked) e.currentTarget.style.background = 'transparent'; }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleKey(key)}
                    style={{ 
                      width: 16, height: 16, cursor: 'pointer', accentColor: '#6366f1',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ overflowX: 'auto', whiteSpace: 'nowrap', flex: 1, paddingBottom: 2, scrollbarWidth: 'thin' }}>
                    {key}
                  </span>
                </label>
              );
            })}
            {filteredKeys.length === 0 && (
              <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                No keys match "{pickerSearch}"
              </div>
            )}
          </div>

          {/* Footer with Add button */}
          <div style={{
            padding: '12px 20px', borderTop: '1px solid var(--border, #e2e8f0)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: '#FAFBFC',
          }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>
              {checkedKeys.size > 0 ? `${checkedKeys.size} key${checkedKeys.size > 1 ? 's' : ''} selected` : 'Check the keys you need'}
            </span>
            <button
              onClick={handleAddSelected}
              disabled={checkedKeys.size === 0}
              style={{
                border: 'none', 
                background: checkedKeys.size > 0 ? 'var(--theme-primary, #6366f1)' : '#e2e8f0',
                color: checkedKeys.size > 0 ? 'white' : '#94a3b8',
                padding: '8px 20px', borderRadius: 8, fontWeight: 700, fontSize: 12,
                cursor: checkedKeys.size > 0 ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 0.2s',
              }}
            >
              <FiCheck size={14} /> Add Selected
            </button>
          </div>
        </div>
      )}

      {/* Backdrop for picker */}
      {pickerVar && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(2px)' }}
          onClick={() => { setPickerVar(null); setPickerSearch(''); setCheckedKeys(new Set()); }}
        />
      )}
    </div>
  );
}

function VariableDropdown({ value, onChange, placeholder, style, id }) {
  const { variables } = useVariablesStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  
  const targetClasses = variables
    .filter(v => v.var_type === 'schema_list' || v.var_type === 'list')
    .flatMap(v => v.var_type === 'list' ? v.value : v.value.map(i => i.name));
    
  const uniqueClasses = [...new Set(targetClasses)];

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const filtered = uniqueClasses.filter(c => c.toLowerCase().includes((value || '').toLowerCase()));

  return (
    <div ref={containerRef} style={{ position: 'relative', width: style?.width || '100%', minWidth: style?.minWidth }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input 
          value={value ?? ''}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          style={{ 
            ...inputStyle, 
            ...style, 
            width: '100%', 
            paddingRight: 30,
            outline: isOpen ? '2px solid var(--accent-btn)' : 'none',
            outlineOffset: -1
          }}
        />
        <div 
          onClick={() => setIsOpen(!isOpen)}
          style={{ 
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', 
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)'
          }}
        >
          <FiChevronDown style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </div>
      </div>
      
      {isOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'white', border: '1px solid var(--border)', borderRadius: 8,
          boxShadow: 'var(--shadow-xl)', zIndex: 10000, maxHeight: 250, overflowY: 'auto',
          padding: '4px'
        }}>
          {uniqueClasses.length === 0 && (
            <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
              No classes found in variables
            </div>
          )}
          {filtered.map(c => (
            <div 
              key={c}
              onClick={() => { onChange(c); setIsOpen(false); }}
              style={{
                padding: '8px 12px', cursor: 'pointer', fontSize: 12, borderRadius: 6,
                background: value === c ? '#F0F4FF' : 'transparent',
                color: value === c ? 'var(--accent-btn)' : 'var(--text-primary)',
                fontWeight: value === c ? 600 : 400
              }}
              onMouseEnter={(e) => { if (value !== c) e.currentTarget.style.background = '#F8FAFC'; }}
              onMouseLeave={(e) => { if (value !== c) e.currentTarget.style.background = 'transparent'; }}
            >
              {c}
            </div>
          ))}
          {filtered.length === 0 && uniqueClasses.length > 0 && (
             <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
               Press Enter to use custom value
             </div>
          )}
        </div>
      )}
    </div>
  );
}

const FONT = "'Google Sans','Roboto',sans-serif";

SyntaxHighlighter.registerLanguage('json', jsonLang);


// Dynamic model lists - populated from backend API on mount, with static fallbacks
const PROVIDERS = [
  'groq', 'openai', 'anthropic', 'google', 'ollama', 'together', 'mistral', 'huggingface',
  'deepseek', 'cohere', 'perplexity', 'openrouter', 'azure', 'bedrock', 'vllm'
];
const MODELS = {
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

const inputStyle = {
  width: '100%', padding: '9px 12px', background: 'white',
  border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)',
  fontSize: 13, outline: 'none', fontFamily: FONT, transition: 'border-color 0.15s',
  boxSizing: 'border-box',
};

function Field({ label, hint, action, children }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{label}</label>
          {hint && (
            <div
              style={{ position: 'relative', display: 'flex', alignItems: 'center', cursor: 'help' }}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <FiInfo size={11} color="var(--text-muted)" style={{ opacity: 0.6 }} />
              {showTooltip && (
                <div style={{
                  position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--text-primary)', color: 'white', padding: '6px 10px', borderRadius: 6,
                  fontSize: 10, width: 180, lineHeight: 1.4, zIndex: 1000, boxShadow: 'var(--shadow-lg)',
                  pointerEvents: 'none', textAlign: 'center'
                }}>
                  {hint}
                  <div style={{
                    position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                    borderWidth: 5, borderStyle: 'solid', borderColor: 'var(--text-primary) transparent transparent transparent'
                  }} />
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
}

function Input({ value, onChange, placeholder, type = 'text', style: extra, disabled }) {
  const onDragOver = (e) => {
    if (e.dataTransfer.types.includes('application/agentmesh-var')) e.preventDefault();
  };
  const onDrop = (e) => {
    const text = e.dataTransfer.getData('application/agentmesh-var');
    if (text) {
      e.preventDefault();
      onChange((value || '') + text);
    }
  };

  return (
    <input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      onDragOver={onDragOver} onDrop={onDrop}
      disabled={disabled}
      style={{ ...inputStyle, ...extra, opacity: disabled ? 0.6 : 1 }}
      onFocus={(e) => !disabled && (e.currentTarget.style.borderColor = 'var(--accent-btn)')}
      onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 4, disabled, style: extra }) {
  const onDragOver = (e) => {
    if (e.dataTransfer.types.includes('application/agentmesh-var')) e.preventDefault();
  };
  const onDrop = (e) => {
    const text = e.dataTransfer.getData('application/agentmesh-var');
    if (text) {
      e.preventDefault();
      onChange((value || '') + text);
    }
  };

  return (
    <textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      onDragOver={onDragOver} onDrop={onDrop}
      disabled={disabled}
      style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6, opacity: disabled ? 0.6 : 1, ...extra }}
      onFocus={(e) => !disabled && (e.currentTarget.style.borderColor = 'var(--accent-btn)')}
      onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
    />
  );
}

function CommaArrayEditor({ value = [], onChange, placeholder, isTextarea = false, rows = 3, style }) {
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
}

function VariablePicker({ onSelect }) {
  const vars = [
    { label: 'Workflow Name', value: '{{workflow_name}}' },
    { label: 'Thread ID', value: '{{thread_id}}' },
    { label: 'Workflow ID', value: '{{workflow_id}}' },
  ];

  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Click or Drag tags to insert
      </label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {vars.map(v => (
          <div
            key={v.value}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('application/agentmesh-var', v.value)}
            onClick={() => onSelect(v.value)}
            title="Click to append or Drag into field"
            style={{
              padding: '5px 10px', background: 'var(--bg-canvas)', border: '1px solid var(--border)',
              borderRadius: 20, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.15s', userSelect: 'none', fontWeight: 600
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--theme-primary)';
              e.currentTarget.style.boxShadow = '0 0 10px var(--theme-primary-glow)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <FiZap size={10} color="var(--accent-btn)" /> {v.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function ApiConfigSection({ data, update, prefix = 'api_', urlKey }) {
  const [activeTab, setActiveTab] = useState('endpoint');
  const scrollRef = useRef(null);

  const tabs = [
    { id: 'endpoint', label: 'Endpoint' },
    { id: 'headers', label: 'Headers' },
    { id: 'auth', label: 'Auth' },
    { id: 'body', label: 'Body' }
  ];

  const method = data[`${prefix}method`] || 'POST';
  const actualUrlKey = urlKey || `${prefix}url`;

  const scrollTabs = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 80, behavior: 'smooth' });
    }
  };

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 20, background: '#fff' }}>
      <style>{`.hide-scroll::-webkit-scrollbar { display: none; }`}</style>
      <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => scrollTabs(-1)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '10px 8px', color: 'var(--text-muted)', fontSize: 10 }}>◀</button>
        <div ref={scrollRef} className="hide-scroll" style={{ display: 'flex', flex: 1, overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {tabs.map(t => (
            <div
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: '10px 16px', fontSize: 12, fontWeight: activeTab === t.id ? 700 : 500,
                color: activeTab === t.id ? 'var(--accent-btn)' : 'var(--text-muted)',
                borderBottom: activeTab === t.id ? '2px solid var(--accent-btn)' : '2px solid transparent',
                cursor: 'pointer', flexShrink: 0, flexGrow: 1, textAlign: 'center', transition: 'all 0.2s'
              }}
            >
              {t.label}
            </div>
          ))}
        </div>
        <button onClick={() => scrollTabs(1)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '10px 8px', color: 'var(--text-muted)', fontSize: 10 }}>▶</button>
      </div>

      <div style={{ padding: 16 }}>
        {activeTab === 'endpoint' && (
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: '120px' }}>
              <Field label="Method">
                <Select
                  value={method}
                  onChange={(v) => update({ [`${prefix}method`]: v })}
                  options={['GET', 'POST', 'PUT', 'DELETE', 'PATCH']}
                />
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Endpoint URL" hint="Supports {{key}} interpolation">
                <Input
                  value={data[actualUrlKey] || ''}
                  onChange={(v) => update({ [actualUrlKey]: v })}
                  placeholder="https://api.example.com/..."
                />
              </Field>
            </div>
          </div>
        )}

        {activeTab === 'headers' && (
          <>
            <KeyValueEditor
              label="Headers"
              value={data[`${prefix}headers`] || {}}
              onChange={(v) => update({ [`${prefix}headers`]: v })}
              hint="e.g. Content-Type: application/json"
            />
            <KeyValueEditor
              label="Query Params"
              value={data[`${prefix}params`] || {}}
              onChange={(v) => update({ [`${prefix}params`]: v })}
              hint="Appended to the URL"
            />
          </>
        )}

        {activeTab === 'auth' && (
          <>
            {data.connection_id ? (
              <div style={{ padding: 12, background: '#F1F5F9', borderRadius: 8, fontSize: 12, color: '#64748B', textAlign: 'center' }}>
                Authentication is automatically handled by the Enterprise Connector (<strong>{data.connection_id}</strong>).
              </div>
            ) : (
              <>
                <Field label="Auth Type">
                  <Select
                    value={data[`${prefix}auth_type`] || 'None'}
                    onChange={(v) => update({ [`${prefix}auth_type`]: v })}
                    options={['None', 'Basic', 'Bearer']}
                  />
                </Field>

                {data[`${prefix}auth_type`] === 'Basic' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Field label="Username">
                      <Input value={data[`${prefix}auth_config`]?.username} onChange={(v) => update({ [`${prefix}auth_config`]: { ...data[`${prefix}auth_config`], username: v } })} placeholder="user" />
                    </Field>
                    <Field label="Password">
                      <Input value={data[`${prefix}auth_config`]?.password} onChange={(v) => update({ [`${prefix}auth_config`]: { ...data[`${prefix}auth_config`], password: v } })} placeholder="pass" type="password" />
                    </Field>
                  </div>
                )}

                {data[`${prefix}auth_type`] === 'Bearer' && (
                  <Field label="Token">
                    <Input value={data[`${prefix}auth_config`]?.token} onChange={(v) => update({ [`${prefix}auth_config`]: { ...data[`${prefix}auth_config`], token: v } })} placeholder="Bearer token…" type="password" />
                  </Field>
                )}
              </>
            )}
          </>
        )}

        {activeTab === 'body' && (
          <>
            {!['POST', 'PUT', 'PATCH'].includes(method) && (
              <div style={{ padding: 12, background: '#F1F5F9', borderRadius: 8, fontSize: 12, color: '#64748B', textAlign: 'center' }}>
                Request Body is typically not used with {method} requests.
              </div>
            )}
            {['POST', 'PUT', 'PATCH'].includes(method) && (
              <Field label="Request Body" hint="JSON or raw text. Supports {{interpolation}}.">
                <Textarea
                  value={data[`${prefix}body`] || ''}
                  onChange={(v) => update({ [`${prefix}body`]: v })}
                  placeholder='{"id": "{{item.id}}"}'
                  rows={6}
                />
              </Field>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CollapsibleApiConfig({ data, update, idx, onRemove }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ marginBottom: 16, border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{ padding: '12px 14px', background: isOpen ? '#F8FAFC' : '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: isOpen ? '1px solid var(--border)' : 'none', transition: 'background 0.2s' }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{isOpen ? '▼' : '▶'}</span>
          Additional API #{idx + 1}
          {data.url && <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>- {data.url}</span>}
        </div>
        <div
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '4px', cursor: 'pointer', transition: 'background 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#FEE2E2'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <FiTrash2 size={14} color="#EF4444" />
        </div>
      </div>
      {isOpen && (
        <div style={{ padding: '14px' }}>
          <ApiConfigSection data={data} update={update} prefix="" urlKey="url" />
        </div>
      )}
    </div>
  );
}

function CustomCollapsibleApiConfig({ apiDef, index, list, keyName, update, providerOptions = [] }) {
  const [isOpen, setIsOpen] = useState(true);

  const localUpdate = (changes) => {
    const next = [...list];
    next[index] = { ...next[index], ...changes };
    update({ [keyName]: next });
  };

  const isCustom = apiDef.provider === 'custom' || !apiDef.provider;

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', background: '#fff', marginTop: 12 }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{ padding: '12px 16px', background: isOpen ? '#F8FAFC' : '#F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isOpen ? '1px solid var(--border)' : 'none', cursor: 'pointer', transition: 'background 0.2s' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }} onClick={(e) => e.stopPropagation()}>
          <span style={{ color: 'var(--text-muted)', fontSize: 10, marginRight: 4, cursor: 'pointer' }} onClick={() => setIsOpen(!isOpen)}>{isOpen ? '▼' : '▶'}</span>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: isCustom ? '#8B5CF6' : '#10B981' }}></div>

          <select
            value={apiDef.provider || 'custom'}
            onChange={(e) => localUpdate({ provider: e.target.value })}
            style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: '#fff', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', minWidth: 160 }}
          >
            {providerOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>

          {isCustom && (
            <input
              placeholder="API Name..."
              value={apiDef.name || ''}
              onChange={(e) => localUpdate({ name: e.target.value })}
              style={{ border: 'none', background: 'transparent', fontWeight: 500, fontSize: 13, outline: 'none', color: 'var(--text-primary)', flex: 1, marginLeft: 8 }}
            />
          )}
        </div>
        <div
          onClick={(e) => {
            e.stopPropagation();
            const next = list.filter((_, i) => i !== index);
            update({ [keyName]: next });
          }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '6px', cursor: 'pointer', transition: 'background 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#FEE2E2'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <FiTrash2 size={15} color="#EF4444" />
        </div>
      </div>
      {isOpen && (
        <div style={{ padding: 16 }}>
          {isCustom ? (
            <ApiConfigSection data={apiDef} update={localUpdate} prefix="" urlKey="url" />
          ) : (
            <div style={{ padding: '12px 16px', background: '#F0FDF4', border: '1px dashed #86EFAC', borderRadius: 8, color: '#166534', fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>✨</span> Built-in Mock Integration. Simulated JSON response will be automatically injected.
            </div>
          )}
        </div>
      )}
    </div>
  );
}



function RuleAccordionItem({ rule, idx, totalRules, updateRule, removeRule, moveRule }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateCode = async () => {
    if (!rule.code || !rule.code.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/agentmesh/utils/action", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_python_rule',
          payload: { prompt: rule.code, existing_code: "" }
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        updateRule(idx, 'code', data.code);
      } else {
        alert(data.message || "Failed to generate rule.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div 
      style={{ 
        border: '1px solid var(--border)', 
        borderRadius: 8, 
        background: 'var(--bg-card)', 
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        marginBottom: 12
      }}
    >
      {/* Header (Accordion Toggle) */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '8px 12px', 
          background: 'var(--bg-canvas)', 
          borderBottom: isExpanded ? '1px solid var(--border)' : 'none',
          cursor: 'pointer'
        }}
        onClick={(e) => {
          // Prevent accordion toggle when interacting with inputs/buttons
          if (['INPUT', 'BUTTON', 'SVG', 'PATH', 'DIV'].includes(e.target.tagName?.toUpperCase()) && e.target.getAttribute('data-prevent-toggle')) return;
          setIsExpanded(!isExpanded);
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
          <div data-prevent-toggle="true" style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingRight: 4, borderRight: '1px solid var(--border)' }}>
            <button data-prevent-toggle="true" onClick={(e) => { e.stopPropagation(); moveRule(idx, -1); }} disabled={idx === 0} style={{ background: 'none', border: 'none', padding: 0, cursor: idx === 0 ? 'default' : 'pointer', color: idx === 0 ? 'var(--border)' : 'var(--text-secondary)' }}><FiChevronDown data-prevent-toggle="true" style={{ transform: 'rotate(180deg)' }} size={12}/></button>
            <button data-prevent-toggle="true" onClick={(e) => { e.stopPropagation(); moveRule(idx, 1); }} disabled={idx === totalRules - 1} style={{ background: 'none', border: 'none', padding: 0, cursor: idx === totalRules - 1 ? 'default' : 'pointer', color: idx === totalRules - 1 ? 'var(--border)' : 'var(--text-secondary)' }}><FiChevronDown data-prevent-toggle="true" size={12}/></button>
          </div>
          <FiChevronDown 
            size={14} 
            color="var(--text-secondary)" 
            style={{ 
              flexShrink: 0, 
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', 
              transition: 'transform 0.2s' 
            }} 
          />
          <input 
            type="text" 
            value={rule.name} 
            data-prevent-toggle="true"
            onChange={(e) => updateRule(idx, 'name', e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', width: '100%', minWidth: '60px', marginLeft: 4 }}
            placeholder="Rule Name"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {/* Custom Toggle Switch */}
          <div 
            onClick={(e) => { e.stopPropagation(); updateRule(idx, 'enabled', !rule.enabled); }}
            data-prevent-toggle="true"
            style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
          >
            <div data-prevent-toggle="true" style={{
              width: 28,
              height: 16,
              background: rule.enabled ? '#10B981' : '#CBD5E1',
              borderRadius: 16,
              position: 'relative',
              transition: 'background 0.2s'
            }}>
              <div data-prevent-toggle="true" style={{
                width: 12,
                height: 12,
                background: 'white',
                borderRadius: '50%',
                position: 'absolute',
                top: 2,
                left: rule.enabled ? 14 : 2,
                transition: 'left 0.2s',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
              }} />
            </div>
            <span data-prevent-toggle="true" style={{ fontSize: 11, fontWeight: 600, color: rule.enabled ? '#059669' : 'var(--text-secondary)' }}>
              {rule.enabled ? 'Active' : 'Disabled'}
            </span>
          </div>
          <button data-prevent-toggle="true" onClick={(e) => { e.stopPropagation(); removeRule(idx); }} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: 4 }} title="Delete Rule">
            <FiTrash2 data-prevent-toggle="true" size={13} />
          </button>
        </div>
      </div>

      {/* Body (Code Editor) */}
      {isExpanded && (
        <div style={{ padding: '12px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <button 
              onClick={handleGenerateCode}
              disabled={isGenerating || !rule.code || !rule.code.trim()}
              style={{
                background: '#F1F5F9',
                color: '#64748B',
                border: '1px solid #E2E8F0',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                cursor: (isGenerating || !rule.code || !rule.code.trim()) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                opacity: (isGenerating || !rule.code || !rule.code.trim()) ? 0.6 : 1,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { if(!isGenerating) { e.currentTarget.style.opacity = '0.9'; } }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              {isGenerating ? <FiLoader className="animate-spin" size={12} /> : <span style={{fontSize: 12}}>✨</span>} 
              {isGenerating ? 'Generating...' : 'AI Wizard'}
            </button>
          </div>

          <textarea
            value={rule.code}
            onChange={(e) => updateRule(idx, 'code', e.target.value)}
            placeholder="# e.g.&#10;if txn.get('amount', 0) > 1000:&#10;    intent = 'block'"
            rows={6}
            style={{ 
              width: '100%', 
              padding: '10px', 
              borderRadius: 6, 
              border: '1px solid var(--border)', 
              background: 'var(--bg-canvas, #F8FAFC)', 
              color: 'var(--text-main)', 
              fontFamily: '"JetBrains Mono", monospace', 
              fontSize: 12, 
              lineHeight: 1.5, 
              boxSizing: 'border-box', 
              resize: 'vertical',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#7C3AED';
              e.target.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.15)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
      )}
    </div>
  );
}
function LogicHelper() {
  const [isOpen, setIsOpen] = useState(false);
  const examples = [
    // === BASIC EXAMPLES ===
    { title: '1. Basic Text Search', code: "'urgent' in msg", desc: "Checks if a word appears in the last message." },
    { title: '2. Simple JSON Key', code: "status == 'active'", desc: "Matches a top-level field from your data." },
    { title: '3. Basic Multi-Condition', code: "status == 'gold' and score >= 500", desc: "Combines two conditions using 'and'." },
    { title: '4. Nested Data (Dot Notation)', code: "user.profile.id == 101", desc: "Access deep JSON data safely." },
    { title: '5. Complex Grouping', code: "(status == 'VIP' or total > 5000) and 'fast_track' in msg", desc: "Uses parentheses to group logic clearly." },
    { title: '6. Safe Callbacks', code: "data.get('score', 0) >= 740", desc: "Uses a default value if the field is missing." },

    // === STRING MATCHING (NEW) ===
    { title: '7. Email Domain Check (Text)', code: "endsWith(msg, '@trans.io')", desc: "Extracts and validates email domain from plain text messages." },
    { title: '8. Email Domain Check (JSON)', code: "endsWith(email, '@trans.io')", desc: "Direct property check on structured JSON data." },
    { title: '9. Exclude Subdomain (Combined)', code: "endsWith(email, '@trans.io') and not startsWith(email, 'xyz')", desc: "Two string conditions: must end with domain AND NOT start with xyz." },
    { title: '10. Username Pattern', code: "startsWith(username, 'admin')", desc: "Check if username starts with a specific prefix." },
    { title: '11. Case-Insensitive Match', code: "equalsIgnoreCase(organization, 'TANTOR')", desc: "Case-insensitive equality check for status/type fields." },
    { title: '12. Message Contains Error', code: "contains(msg, 'ERROR') and not contains(msg, 'WARNING')", desc: "Check for errors but exclude false positives." },
    { title: '13. Regex Email Validation', code: "matches(email, r'^[a-zA-Z0-9._%+-]+@trans\\\\.io$')", desc: "Full regex pattern validation for format enforcement." },
    { title: '14. Nested JSON String Match', code: "endsWith(user.profile.email, '@trans.io') and user.organization == 'Tantor'", desc: "Combine nested property access with string matching." },
    { title: '15. OCR Content Check', code: "latest_ocr_output != None", desc: "Ensures the OCR process returned content before proceeding (no brackets needed)." },
  ];

  return (
    <div style={{ marginTop: 15, borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden', background: '#F8FAFC' }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F1F5F9' }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiBookOpen size={12} color="var(--accent-btn)" /> LOGIC EXAMPLES GUIDE
        </span>
        <FiChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>

      {isOpen && (
        <div style={{ padding: '10px' }}>
          {examples.map((ex, i) => (
            <div key={i} style={{ marginBottom: 12, lastChild: { marginBottom: 0 } }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>{ex.title}</div>
              <div style={{
                background: '#1E293B', color: '#F1F5F9', padding: '6px 10px', borderRadius: 6, fontSize: 11,
                fontFamily: 'monospace', marginBottom: 4, position: 'relative'
              }}>
                {ex.code}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontStyle: 'italic' }}>{ex.desc}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Select({ value, onChange, options, disabled }) {
  return (
    <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{ ...inputStyle, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1 }}
    >
      {options.map((o) => (
        <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
          {typeof o === 'string' ? o : o.label}
        </option>
      ))}
    </select>
  );
}

function SearchableSelect({ value, onChange, options, placeholder = "Search...", disabled, showSearch = true }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
    if (!isOpen) setSearch('');
  }, [isOpen]);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    (o.value || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          ...inputStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: disabled ? '#F1F5F9' : 'white',
          borderColor: isOpen ? 'var(--accent-btn)' : 'var(--border)',
          opacity: disabled ? 0.7 : 1
        }}
      >
        <span style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: selectedOption ? 'var(--text-primary)' : 'var(--text-muted)'
        }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <FiChevronDown size={14} style={{ color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'white', border: '1px solid var(--border)', borderRadius: 10,
          boxShadow: 'var(--shadow-xl)', zIndex: 1000, overflow: 'hidden'
        }}>
          {showSearch && (
            <div style={{ padding: '8px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-card-neutral, #F8FAFC)' }}>
              <div style={{ position: 'relative' }}>
                <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  ref={inputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Type to filter..."
                  style={{
                    width: '100%', padding: '7px 10px 7px 32px', borderRadius: 6, border: '1px solid var(--border)',
                    fontSize: 12, outline: 'none', background: 'var(--bg-secondary, white)'
                  }}
                />
              </div>
            </div>
          )}
          <div style={{ maxHeight: 220, overflowY: 'auto', padding: '4px' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '12px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>No results found</div>
            ) : (
              filtered.map(o => (
                <div
                  key={o.value}
                  onClick={() => { onChange(o.value); setIsOpen(false); }}
                  style={{
                    padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
                    background: value === o.value ? '#F0F4FF' : 'transparent',
                    color: value === o.value ? 'var(--accent-btn)' : 'var(--text-primary)',
                    fontWeight: value === o.value ? 600 : 400,
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card-info, #F0F4FF)'; e.currentTarget.style.color = 'var(--accent-btn)'; }}
                  onMouseLeave={(e) => {
                    if (value !== o.value) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.label}</div>
                    {o.sublabel && <div style={{ fontSize: 10, opacity: 0.6, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.sublabel}</div>}
                  </div>
                  {o.onDelete && (
                    <div
                      onClick={(e) => { e.stopPropagation(); o.onDelete(); }}
                      style={{ padding: '4px', borderRadius: 4, cursor: 'pointer', color: '#EF4444', opacity: 0.5, flexShrink: 0 }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
                      title="Delete"
                    >
                      <FiTrash2 size={12} />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 40, height: 22, borderRadius: 11, cursor: 'pointer', position: 'relative',
          background: checked ? 'var(--accent-btn)' : '#e2e8f0',
          transition: 'all 0.2s',
          flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: 3, left: checked ? 21 : 3, width: 16, height: 16,
          borderRadius: '50%', background: '#fff', transition: 'left 0.2s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }} />
      </div>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
    </div>
  );
}

function KeyValueEditor({ value = {}, onChange, label, hint }) {
  const entries = Object.entries(value);

  const updateKey = (oldKey, newKey) => {
    if (oldKey === newKey) return;
    const next = { ...value };
    const val = next[oldKey];
    delete next[oldKey];
    next[newKey] = val;
    onChange(next);
  };

  const updateVal = (key, newVal) => {
    onChange({ ...value, [key]: newVal });
  };

  const removeEntry = (key) => {
    const next = { ...value };
    delete next[key];
    onChange(next);
  };

  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8 }}>{label}</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {entries.map(([k, v], i) => (
          <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <Input
              style={{ flex: 1, padding: '6px 10px', fontSize: 12 }}
              value={k}
              onChange={(newKey) => updateKey(k, newKey)}
              placeholder="Key"
            />
            <Input
              style={{ flex: 2, padding: '6px 10px', fontSize: 12 }}
              value={v}
              onChange={(newVal) => updateVal(k, newVal)}
              placeholder="Value"
            />
            <button
              onClick={() => removeEntry(k)}
              style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}
            >
              <FiTrash2 size={12} />
            </button>
          </div>
        ))}
        <button
          onClick={() => onChange({ ...value, [`key_${entries.length + 1}`]: '' })}
          style={{
            padding: '8px', background: '#F8FAFC', border: '1px dashed var(--border)',
            borderRadius: 8, fontSize: 11, color: 'var(--accent-btn)', cursor: 'pointer',
            fontWeight: 600, marginTop: 4
          }}
        >
          + Add Field
        </button>
      </div>
      {hint && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

function ToolConfigModal({ toolName, config = {}, onChange, onClose, onRemove, availableTools = [] }) {
  const toolInfo = availableTools.find(t => t.name === toolName) || { name: toolName };

  // Helper to update a single config key
  const set = (key, val) => onChange({ ...config, [key]: val });

  // Determine fields to show
  const toolConfigs = toolInfo.configs || [];

  // Effect to apply backend-driven default values for missing fields
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}>
      <div style={{ width: 440, background: 'white', borderRadius: 16, boxShadow: 'var(--shadow-2xl)', overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiSettings size={16} color="#475569" />
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{toolInfo.display_name || toolName} Settings</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><FiX size={18} /></button>
        </div>

        <div style={{ padding: '20px', maxHeight: '76vh', overflowY: 'auto' }}>
          <Toggle checked={config.return_direct || false} onChange={(v) => set('return_direct', v)} label="Return result direct to user" />
          <Toggle checked={config.interrupt_before || false} onChange={(v) => set('interrupt_before', v)} label="Pause before execution (Human approval)" />

          {toolName === 'chart_generator' && (
            <>
              <div style={{ height: '1px', background: 'var(--border)', margin: '16px 0' }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Chart Generator LLM</div>
              <LLMConfigSection
                llm={toolLlm}
                onChange={handleLlmChange}
              />
            </>
          )}

          <div style={{ height: '1px', background: 'var(--border)', margin: '16px 0' }} />
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Parameter Overrides (Human-Only)</div>

          {fields.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
            <div style={{ padding: 12, background: '#F1F5F9', borderRadius: 8, fontSize: 12, color: '#475569', textAlign: 'center' }}>
              No specific parameter overrides defined for this tool.
            </div>
          )}
        </div>

        <div style={{ padding: '16px 20px', background: '#F8FAFC', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 16px', background: 'var(--accent-btn)', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function ToolTagInput({ value = [], configs = {}, onUpdate, availableTools = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [configTool, setConfigTool] = useState(null);
  const containerRef = React.useRef(null);
  const searchInputRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (!isOpen) setSearchTerm('');
  }, [isOpen]);

  const add = (tName) => {
    if (!value.includes(tName)) {
      const nextTools = [...value, tName];
      const nextConfigs = { ...configs };

      // Auto-initialize defaults for RAG/Memory tools so they are strictly 'Human-Only'
      if (tName.toLowerCase().includes('rag') || tName.toLowerCase().includes('memory')) {
        nextConfigs[tName] = {
          collection_name: 'default',
          k: 5,
          threshold: 0.5,
          vector_store_type: 'chroma'
        };
      }
      onUpdate(nextTools, nextConfigs);
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  const remove = (tName) => {
    const nextTools = value.filter((x) => x !== tName);
    const nextConfigs = { ...configs };
    delete nextConfigs[tName]; // Clean up config when tool is removed
    onUpdate(nextTools, nextConfigs);
  };

  const unselectedTools = availableTools.filter(t => !value.includes(t.name));
  const filteredTools = unselectedTools.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.display_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.category && t.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ position: 'relative' }} ref={containerRef}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 10,
        minHeight: 46,
        padding: '8px 40px 8px 8px', // Right padding for fixed plus button
        border: '1px solid var(--border)',
        borderRadius: 12,
        background: 'var(--bg-canvas)',
        position: 'relative'
      }}>
        {value.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: 12, padding: '6px 8px' }}>No tools assigned</span>}
        {value.map((t) => {
          const toolInfo = availableTools.find(at => at.name === t);
          const description = toolInfo?.description || "No description available";

          return (
            <span
              key={t}
              title={description}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 10px',
                background: 'white',
                border: '1px solid var(--border)',
                borderRadius: 20,
                fontSize: 11,
                color: 'var(--text-primary)',
                fontWeight: 600,
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                cursor: 'help'
              }}
            >
              {t}
              <button
                onClick={() => setConfigTool(t)}
                style={{ background: 'none', border: 'none', color: '#4285F4', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                title="Configure parameters"
              >
                <FiSettings size={12} />
              </button>
              <button onClick={() => remove(t)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0, marginLeft: 2 }}>&times;</button>
            </span>
          );
        })}

        {/* Fixed Plus Button in Top Right */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 26,
            height: 26,
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: isOpen ? 'var(--accent-btn)' : '#64748B',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s',
            zIndex: 5
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-btn)'; e.currentTarget.style.color = 'var(--accent-btn)'; }}
          onMouseLeave={(e) => { if (!isOpen) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = '#64748B'; } }}
        >
          {isOpen ? <FiX size={14} /> : <FiPlus size={14} />}
        </button>
      </div>

      {configTool && (
        <ToolConfigModal
          toolName={configTool}
          config={configs[configTool] || {}}
          availableTools={availableTools}
          onClose={() => setConfigTool(null)}
          onChange={(newConf) => onUpdate(value, { ...configs, [configTool]: newConf })}
        />
      )}

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% - 6px)',
          left: 0,
          right: 0,
          zIndex: 110,
          background: 'white',
          border: '1px solid var(--border)',
          borderRadius: 12,
          boxShadow: 'var(--shadow-2xl)',
          marginTop: 4,
          overflow: 'hidden'
        }}>
          {/* Tool Search Bar */}
          <div style={{ padding: '10px', borderBottom: '1px solid var(--border-light)', background: '#F8FAFC' }}>
            <div style={{ position: 'relative' }}>
              <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                ref={searchInputRef}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tools by name or description..."
                style={{
                  width: '100%',
                  padding: '8px 10px 8px 32px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  fontSize: 12,
                  outline: 'none',
                  background: 'white',
                  fontFamily: FONT
                }}
              />
            </div>
          </div>

          <div style={{ maxHeight: 220, overflowY: 'auto', padding: '4px' }}>
            {filteredTools.length === 0 ? (
              <div style={{ padding: '24px 12px', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                <FiTool size={20} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.3 }} />
                {searchTerm ? `No tools matching "${searchTerm}"` : (availableTools.length === 0 ? 'No tools registered. Go to Tools page to add some.' : 'All tools already added.')}
              </div>
            ) : (
              filteredTools.map(t => (
                <div
                  key={t.name}
                  onClick={() => add(t.name)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    margin: '2px'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#F0F4FF'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.transform = 'translateX(0)'; }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {t.display_name || t.name}
                    <FiPlus size={12} color="var(--accent-btn)" style={{ opacity: 0.6 }} />
                  </div>
                  {t.description && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>{t.description}</div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FormFieldsEditor({ fields = [], onChange }) {
  const addField = () => {
    const newField = { id: `field_${fields.length + 1}`, label: `New Field ${fields.length + 1}`, type: 'text', required: false };
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
  };

  const moveField = (idx, dir) => {
    if ((idx === 0 && dir === -1) || (idx === fields.length - 1 && dir === 1)) return;
    const next = [...fields];
    const target = idx + dir;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiEdit size={12} color="var(--accent-btn)" /> Form Fields
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {fields.map((f, i) => (
          <div key={i} style={{ padding: 12, background: '#F8FAFC', borderRadius: 10, border: '1px solid var(--border)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
              <button onClick={() => moveField(i, -1)} disabled={i === 0} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', opacity: i === 0 ? 0.3 : 1 }}><FiChevronDown size={14} style={{ transform: 'rotate(180deg)' }} /></button>
              <button onClick={() => moveField(i, 1)} disabled={i === fields.length - 1} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', opacity: i === fields.length - 1 ? 0.3 : 1 }}><FiChevronDown size={14} /></button>
              <button onClick={() => removeField(i)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', marginLeft: 4 }}><FiTrash2 size={14} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 0 }}>
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
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <Toggle checked={f.required} onChange={(v) => updateField(i, { required: v })} label="Required" />
                    </div>
                  </div>
                </>
              )}
            </div>

            {(f.type === 'select' || f.type === 'multiselect') && (
              <div style={{ marginTop: 8 }}>
                <Field label="Options (One per line)" hint="Enter each option on a separate line. Use {{variable}} (e.g. {{techniques}}) to load a list from context.">
                  <textarea
                    value={f.options?.join('\n') || ''}
                    onChange={(e) => updateField(i, { options: e.target.value.split('\n').map(s => s.trim()) })}
                    placeholder={"First Option\nSecond Option\n{{techniques}}"}
                    style={{
                      width: '100%', minHeight: 80, padding: '12px 14px', borderRadius: 10,
                      border: '1px solid var(--border)', background: '#F9FAFB', fontSize: 13,
                      fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box'
                    }}
                  />
                </Field>
              </div>
            )}

            {f.type === 'remark' && (
              <div style={{ marginTop: 8 }}>
                <Field label="Remark Content" hint="Static text to be displayed in the form (supports basic formatting).">
                  <textarea
                    value={f.content || ''}
                    onChange={(e) => updateField(i, { content: e.target.value })}
                    placeholder={"General Terms:\n1. Non-refundable\n2. Requires ID verification"}
                    style={{
                      width: '100%', minHeight: 100, padding: '12px 14px', borderRadius: 10,
                      border: '1px solid var(--border)', background: '#F9FAFB', fontSize: 13,
                      fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box'
                    }}
                  />
                </Field>
              </div>
            )}
          </div>
        ))}

        <button
          onClick={addField}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px', borderRadius: 10, border: '1px dashed #CBD5E1',
            background: 'white', color: '#64748B', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-btn)'; e.currentTarget.style.color = 'var(--accent-btn)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.color = '#64748B'; }}
        >
          <FiPlus size={14} /> Add Form Field
        </button>
      </div>
    </div>
  );
}

const MiniatureToggle = ({ checked, onChange }) => (
  <div
    onClick={() => onChange(!checked)}
    style={{
      width: 28,
      height: 16,
      borderRadius: 8,
      cursor: 'pointer',
      position: 'relative',
      background: checked ? 'var(--theme-primary, #8B5CF6)' : '#E2E8F0',
      transition: 'all 0.2s',
      flexShrink: 0
    }}
  >
    <div style={{
      position: 'absolute',
      top: 2,
      left: checked ? 14 : 2,
      width: 12,
      height: 12,
      borderRadius: '50%',
      background: '#fff',
      transition: 'left 0.2s ease',
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
    }} />
  </div>
);

function WeightageCategoriesEditor({ categories = [], onChange }) {
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
    // lowercase, replace spaces with underscores, remove any other invalid special characters
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
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiSliders size={12} color="var(--accent-btn)" /> Categories & Rules
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {categories.map((cat, catIdx) => {
          const isCatCollapsed = collapsedCategories[catIdx];
          const isCatEnabled = cat.enabled !== false;
          return (
            <div key={catIdx} style={{ padding: 14, background: '#F8FAFC', borderRadius: 12, border: '1px solid var(--border)', position: 'relative', opacity: isCatEnabled ? 1 : 0.6, boxShadow: '0 2px 8px rgba(124, 58, 237, 0.04)' }}>

              {/* Category Header Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'absolute', top: 12, right: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center' }} title="Toggle Category Enabled">
                  <MiniatureToggle
                    checked={isCatEnabled}
                    onChange={(v) => updateCategory(catIdx, { enabled: v })}
                  />
                </div>
                <button
                  onClick={() => toggleCategoryCollapse(catIdx)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  title={isCatCollapsed ? "Expand Category" : "Collapse Category"}
                >
                  <FiChevronDown size={16} style={{ transform: isCatCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }} />
                </button>
                <button
                  onClick={() => removeCategory(catIdx)}
                  style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  title="Delete Category"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>

              {/* Category Name Input */}
              <div style={{ marginRight: 100 }}>
                <Field label="Category Name" hint="Lowercase & underscores only. spaces auto-replaced by _">
                  <Input
                    value={cat.name}
                    onChange={(v) => updateCategory(catIdx, { name: v })}
                    placeholder="e.g. loan_scoring"
                    disabled={!isCatEnabled}
                  />
                </Field>
              </div>

              {/* Fields List (collapsible) */}
              {!isCatCollapsed && (
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fields in {cat.name}</div>

                  {(cat.fields || []).map((field, fieldIdx) => {
                    const fieldKey = `${catIdx}_${fieldIdx}`;
                    const isFieldCollapsed = collapsedFields[fieldKey];
                    const isFieldEnabled = field.enabled !== false;
                    return (
                      <div key={fieldIdx} style={{ padding: 12, background: 'white', borderRadius: 10, border: '1px solid #E2E8F0', opacity: isFieldEnabled && isCatEnabled ? 1 : 0.6, boxShadow: '0 1px 4px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: 10 }}>

                        {/* Field Header Controls (Responsive layout) */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>Field Config</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center' }} title="Toggle Field Enabled">
                              <MiniatureToggle
                                checked={isFieldEnabled}
                                onChange={(v) => updateField(catIdx, fieldIdx, { enabled: v })}
                              />
                            </div>
                            <button
                              onClick={() => toggleFieldCollapse(catIdx, fieldIdx)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                              title={isFieldCollapsed ? "Expand Field" : "Collapse Field"}
                            >
                              <FiChevronDown size={14} style={{ transform: isFieldCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }} />
                            </button>
                            <button
                              onClick={() => removeField(catIdx, fieldIdx)}
                              style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                              title="Delete Field"
                            >
                              <FiTrash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Field Config Area */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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

                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <div style={{ flex: '1 1 120px' }}>
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
                            <div style={{ flex: '1 1 80px' }}>
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

                          {/* Conditions (collapsible) */}
                          {!isFieldCollapsed && (
                            <div style={{ borderTop: '1px dashed #E2E8F0', paddingTop: 10 }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>Conditions & Weights</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {(field.conditions || []).map((cond, condIdx) => {
                                  const isCondEnabled = cond.enabled !== false;
                                  return (
                                    <div key={condIdx} style={{ display: 'flex', gap: 0, alignItems: 'center', padding: '6px 8px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #F1F5F9', opacity: isCondEnabled && isFieldEnabled && isCatEnabled ? 1 : 0.6 }}>
                                      <div style={{ width: `${conditionWidthPct}%`, flexShrink: 0, paddingRight: 4, boxSizing: 'border-box' }}>
                                        <Textarea
                                          value={cond.condition}
                                          onChange={(v) => updateCondition(catIdx, fieldIdx, condIdx, { condition: v })}
                                          placeholder="Condition (e.g. loan_amount > 5000)"
                                          disabled={!isCondEnabled || !isFieldEnabled || !isCatEnabled}
                                          rows={1}
                                          style={{ minHeight: '34px', padding: '6px 10px' }}
                                        />
                                      </div>

                                      {/* Drag Handle */}
                                      <div
                                        onMouseDown={(e) => handleMouseDown(e, e.currentTarget.parentNode)}
                                        style={{
                                          width: 12,
                                          cursor: 'col-resize',
                                          display: 'flex',
                                          justifyContent: 'center',
                                          alignItems: 'center',
                                          alignSelf: 'stretch',
                                          userSelect: 'none',
                                          margin: '0 4px',
                                          position: 'relative'
                                        }}
                                        title="Drag to resize horizontally"
                                      >
                                        <div style={{ width: 2, height: '85%', background: '#CBD5E1', borderRadius: 1 }} />
                                      </div>

                                      <div style={{ flex: 1, paddingRight: 8, boxSizing: 'border-box' }}>
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
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                        <div title="Toggle Condition Enabled" style={{ display: 'flex', alignItems: 'center' }}>
                                          <MiniatureToggle
                                            checked={isCondEnabled}
                                            onChange={(v) => updateCondition(catIdx, fieldIdx, condIdx, { enabled: v })}
                                          />
                                        </div>
                                        <button
                                          onClick={() => removeCondition(catIdx, fieldIdx, condIdx)}
                                          style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}
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
                                  style={{
                                    alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 4,
                                    padding: '6px 10px', borderRadius: 6, border: '1px dashed var(--border)',
                                    background: '#F8FAFC', color: 'var(--text-secondary)', fontSize: 10, fontWeight: 600,
                                    cursor: isFieldEnabled && isCatEnabled ? 'pointer' : 'not-allowed',
                                    opacity: isFieldEnabled && isCatEnabled ? 1 : 0.5
                                  }}
                                >
                                  <FiPlus size={10} /> Add Condition
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <button
                    onClick={() => addField(catIdx)}
                    style={{
                      alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 12px', borderRadius: 8, border: '1px dashed var(--border)',
                      background: 'white', color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600,
                      cursor: 'pointer'
                    }}
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
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px', borderRadius: 10, border: '1px dashed var(--border)',
            background: 'white', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-btn)'; e.currentTarget.style.color = 'var(--accent-btn)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <FiPlus size={14} /> Add Category
        </button>
      </div>
    </div>
  );
}

function CustomRegexEditor({ value = [], onChange }) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showAddTooltip, setShowAddTooltip] = React.useState(false);

  const add = () => onChange([...value, { label: '', pattern: '' }]);
  const updateItem = (idx, patch) => {
    const next = [...value];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };
  const remove = (idx) => onChange(value.filter((_, i) => i !== idx));

  const presets = [
    { label: 'Phone Number', pattern: '\\b[6-9]\\d{9}\\b' },
    { label: 'Email', pattern: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b' },
    { label: 'Aadhaar', pattern: '\\b\\d{4}-\\d{4}-\\d{4}\\b' },
    { label: 'PAN', pattern: '\\b[A-Z]{5}[0-9]{4}[A-Z]\\b' },
    { label: 'IFSC Code', pattern: '\\b[A-Z]{4}0[A-Z0-9]{6}\\b' },
    { label: 'Account Number', pattern: '\\b\\d{9,18}\\b' },
    { label: 'DOB', pattern: '\\b\\d{2}[-/]\\d{2}[-/]\\d{4}\\b' }
  ];

  const filteredPresets = presets.filter(p =>
    p.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredValue = value
    .map((item, originalIdx) => ({ ...item, originalIdx }))
    .filter(item =>
      item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.pattern.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div style={{ marginTop: 15 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Custom Regex Patterns
        </label>

        <div style={{ position: 'relative' }}>
          <button
            onClick={add}
            onMouseEnter={() => setShowAddTooltip(true)}
            onMouseLeave={() => setShowAddTooltip(false)}
            style={{
              background: 'none', border: 'none', color: 'var(--accent-btn)',
              cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center',
              borderRadius: 4, transition: 'background 0.2s'
            }}
          >
            <FiPlus size={16} strokeWidth={3} />
          </button>
          {showAddTooltip && (
            <div style={{
              position: 'absolute', bottom: 'calc(100% + 8px)', right: 0,
              background: 'var(--text-primary)', color: 'white', padding: '5px 10px', borderRadius: 6,
              fontSize: 10, whiteSpace: 'nowrap', zIndex: 100, boxShadow: 'var(--shadow-md)'
            }}>
              Add Manual Regex
              <div style={{
                position: 'absolute', top: '100%', right: 6,
                borderWidth: 5, borderStyle: 'solid', borderColor: 'var(--text-primary) transparent transparent transparent'
              }} />
            </div>
          )}
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: 12 }}>
        <FiSearch size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.7 }} />
        <input
          type="text"
          placeholder="Search patterns or presets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            ...inputStyle,
            padding: '7px 10px 7px 32px',
            fontSize: 12,
            background: '#F8FAFC'
          }}
        />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {filteredPresets.map(p => {
          const isSelected = value.some(v => v.pattern === p.pattern);
          return (
            <button
              key={p.label}
              onClick={() => {
                if (!isSelected) {
                  onChange([...value, p]);
                } else {
                  onChange(value.filter(v => v.pattern !== p.pattern));
                }
              }}
              style={{
                padding: '5px 12px',
                background: isSelected ? '#F5F3FF' : '#F1F5F9',
                border: '1px solid',
                borderColor: isSelected ? '#DDD6FE' : 'var(--border)',
                borderRadius: 8,
                fontSize: 10,
                cursor: 'pointer',
                color: isSelected ? '#7C3AED' : 'var(--text-secondary)',
                fontWeight: isSelected ? 600 : 400,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              {isSelected ? <FiCheck size={10} /> : <FiPlus size={10} />}
              {p.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filteredValue.map((item) => (
          <div key={item.originalIdx} style={{ padding: 10, background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--border)', position: 'relative' }}>
            <button
              onClick={() => remove(item.originalIdx)}
              style={{ position: 'absolute', top: 6, right: 6, background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
            >
              <FiX size={12} />
            </button>
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>LABEL</label>
                <Input value={item.label} onChange={(v) => updateItem(item.originalIdx, { label: v })} placeholder="e.g. Phone" style={{ padding: '4px 8px', fontSize: 11 }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>REGEX PATTERN</label>
              <Input value={item.pattern} onChange={(v) => updateItem(item.originalIdx, { pattern: v })} placeholder="e.g. \\d{10}" style={{ padding: '4px 8px', fontSize: 11, fontFamily: 'monospace' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClassificationClassesEditor({ value = [], onChange, engine }) {
  const add = () => {
    if (engine === 'regex') {
      onChange([...value, { class: '', regex_patterns: '' }]);
    } else {
      onChange([...value, { class: '', description: '' }]);
    }
  };
  const updateItem = (idx, patch) => {
    const next = [...value];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };
  const remove = (idx) => onChange(value.filter((_, i) => i !== idx));

  const autoPopulate = () => {
    try {
      const vars = window.globalVars?.classes || useWorkflowStore.getState().globalVariables?.classes || [];
      if (vars && Array.isArray(vars) && vars.length > 0) {
        onChange([...value, ...vars.map(c => ({ class: c.name || c, description: c.description || c.desc || '' }))]);
        toast.success('Classes populated from global vars!');
      } else {
        toast.error('No classes found in global vars.');
      }
    } catch(e) {
      toast.error('Failed to populate from global vars.');
    }
  };

  return (
    <div style={{ marginTop: 15 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {engine === 'regex' ? 'Classes & Regex Patterns' : 'Classes & Descriptions'}
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={autoPopulate}
            title="Auto-Populate from Global Vars"
            style={{
              background: 'none', border: 'none', color: '#8B5CF6',
              cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center',
              borderRadius: 4, transition: 'background 0.2s', gap: 4, fontSize: 11, fontWeight: 600
            }}
          >
            <FiZap size={14} /> Auto
          </button>
          <button
            onClick={add}
            style={{
              background: 'none', border: 'none', color: 'var(--accent-btn)',
              cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center',
              borderRadius: 4, transition: 'background 0.2s'
            }}
          >
            <FiPlus size={16} strokeWidth={3} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {value.map((item, idx) => (
          <div key={idx} style={{ padding: 10, background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--border)', position: 'relative' }}>
            <button
              onClick={() => remove(idx)}
              style={{ position: 'absolute', top: 6, right: 6, background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
            >
              <FiX size={12} />
            </button>
            <div style={{ marginBottom: 6 }}>
              <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>CLASS NAME</label>
              <Input value={item.class} onChange={(v) => updateItem(idx, { class: v })} placeholder="e.g. Support" style={{ padding: '4px 8px', fontSize: 11 }} />
            </div>
            {engine === 'regex' ? (
              <div>
                <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>REGEX PATTERNS (comma-separated)</label>
                <Input value={item.regex_patterns || ''} onChange={(v) => updateItem(idx, { regex_patterns: v })} placeholder="e.g. help,support,login" style={{ padding: '4px 8px', fontSize: 11 }} />
              </div>
            ) : (
              <div>
                <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>DESCRIPTION</label>
                <Input value={item.description || ''} onChange={(v) => updateItem(idx, { description: v })} placeholder="e.g. User asking for tech help" style={{ padding: '4px 8px', fontSize: 11 }} />
              </div>
            )}
          </div>
        ))}
        {value.length === 0 && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
            No classes defined. Click the plus button above to add classes.
          </div>
        )}
      </div>
    </div>
  );
}

// Inline node ID list editor (for supervisor/swarm member_ids)
function NodeIdList({ value = [], onChange, placeholder, allNodes = [] }) {
  const [input, setInput] = useState('');

  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInput('');
    }
  };

  const remove = (id) => onChange(value.filter(x => x !== id));

  // Available nodes to pick from (excluding already selected)
  const available = allNodes.filter(n => !value.includes(n.id) && !['start', 'end', '__start__', '__end__'].includes(n.id));

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <select
          value=""
          onChange={(e) => { if (e.target.value && !value.includes(e.target.value)) { onChange([...value, e.target.value]); } }}
          style={{ ...inputStyle, flex: 1, cursor: 'pointer' }}
        >
          <option value="">Select a node to add…</option>
          {available.map(n => (
            <option key={n.id} value={n.id}>{n.data?.label || n.id} ({n.data?.type})</option>
          ))}
        </select>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {value.filter(id => allNodes.some(n => n.id === id)).map((id) => {
          const targetNode = allNodes.find(n => n.id === id);
          return (
            <span key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 20, fontSize: 11, color: '#4338CA', fontWeight: 600 }}>
              {targetNode?.data?.label || id}
              <button onClick={() => remove(id)} style={{ background: 'none', border: 'none', color: '#6366F1', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>&times;</button>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function LLMConfigSection({ llm, onChange }) {
  const provider = llm?.provider || 'groq';
  const models = MODELS[provider] || [];
  const isOllama = provider === 'ollama';

  return (
    <>
      <Field label="Provider">
        <Select value={provider} onChange={(v) => onChange({ ...llm, provider: v, model: MODELS[v]?.[0] || '' })} options={PROVIDERS} />
      </Field>
      <Field label="Model">
        <Select value={llm?.model || ''} onChange={(v) => onChange({ ...llm, model: v })} options={[...(models), ...(llm?.model && !models.includes(llm.model) ? [llm.model] : [])]} />
      </Field>
      <Field label="Temperature">
        <Input type="number" value={llm?.temperature ?? 0} onChange={(v) => onChange({ ...llm, temperature: parseFloat(v) || 0 })} placeholder="0.0" style={{ width: '100%' }} />
      </Field>
      {isOllama ? (
        <Field label="Ollama Base URL" hint="e.g., http://73.245.233.186:31059 or http://localhost:11434">
          <Input value={llm?.base_url || ''} onChange={(v) => onChange({ ...llm, base_url: v || null })} placeholder="http://localhost:11434" />
        </Field>
      ) : (
        <Field label="API Key Override" hint="Leave blank to use the backend's default key.">
          <Input value={llm?.api_key_override || ''} onChange={(v) => onChange({ ...llm, api_key_override: v || null })} placeholder="sk-..." type="password" />
        </Field>
      )}
    </>
  );
}

function IterationConfigSection({ policy, onChange }) {
  const enabled = policy?.enabled || false;
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiRepeat size={12} color="var(--accent-btn)" /> Iteration & Self-Correction
        </div>
        <Toggle checked={enabled} onChange={(v) => onChange({ ...policy, enabled: v })} label="" />
      </div>

      {enabled ? (
        <div style={{ padding: '4px 0 0 10px', borderLeft: '2px solid var(--accent-glow)' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <Field label="Max Retries" hint="Maximum number of refinement iterations allowed before stopping.">
                <Input type="number" value={policy?.max_iterations ?? 3} onChange={(v) => onChange({ ...policy, max_iterations: parseInt(v) || 3 })} placeholder="3" />
              </Field>
            </div>
            <div style={{ flex: 1 }}>
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
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', paddingLeft: 10 }}>
          Self-correction is disabled. Enable to allow automatic peer review.
        </div>
      )}
    </div>
  );
}

function WizardButton({ onClick, loading, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
        fontSize: 11, color: '#8B5CF6', fontWeight: 600, opacity: (disabled || loading) ? 0.5 : 1,
        transition: 'all 0.2s', padding: '2px 6px', borderRadius: 4
      }}
      onMouseEnter={(e) => { if (!loading && !disabled) e.currentTarget.style.background = '#F5F3FF'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
      title="Fix Grammar (Wizard)"
    >
      {loading ? <FiLoader className="animate-spin" size={12} /> : <FiZap size={12} />}
      {loading ? 'Generating...' : 'Wizard'}
    </button>
  );
}

function CronHelper({ value, onChange }) {
  // Parse initial state from the current 'value'
  const getInitialState = () => {
    let mode = 'simple';
    let freq = 'daily';
    let hour = '09';
    let min = '00';
    let days = ['1', '2', '3', '4', '5'];

    if (!value || value === '* * * * *' || value === '*/1 * * * *') {
      return { mode, freq: 'minute', hour, min, days };
    }

    // Daily: "mm HH * * *"
    const dailyMatch = value.match(/^(\d{1,2}) (\d{1,2}) \* \* \*$/);
    if (dailyMatch) {
      return { mode, freq: 'daily', hour: dailyMatch[2].padStart(2, '0'), min: dailyMatch[1].padStart(2, '0'), days };
    }

    // Weekly: "mm HH * * dd,dd"
    const weeklyMatch = value.match(/^(\d{1,2}) (\d{1,2}) \* \* ([\d,]+)$/);
    if (weeklyMatch) {
      return { mode, freq: 'weekly', hour: weeklyMatch[2].padStart(2, '0'), min: weeklyMatch[1].padStart(2, '0'), days: weeklyMatch[3].split(',') };
    }

    if (value === '0 * * * *') {
      return { mode, freq: 'hourly', hour, min, days };
    }

    return { mode: 'advanced', freq, hour, min, days };
  };

  const initialState = getInitialState();

  const [mode, setMode] = useState(initialState.mode);
  const [freq, setFreq] = useState(initialState.freq);
  const [hour, setHour] = useState(initialState.hour);
  const [min, setMin] = useState(initialState.min);
  const [days, setDays] = useState(initialState.days);

  // Ref to track if the last change was internal or external
  const lastInternalValue = React.useRef(value);

  // Sync internal state from prop (External -> Internal)
  useEffect(() => {
    if (!value || value === lastInternalValue.current) return;

    const trySetSimple = (f, h, m, d) => {
      setMode('simple');
      setFreq(f);
      if (h !== undefined) setHour(h);
      if (m !== undefined) setMin(m);
      if (d !== undefined) setDays(d);
    };

    // Daily: "mm HH * * *"
    const dailyMatch = value.match(/^(\d{1,2}) (\d{1,2}) \* \* \*$/);
    if (dailyMatch) return trySetSimple('daily', dailyMatch[2].padStart(2, '0'), dailyMatch[1].padStart(2, '0'));

    // Weekly: "mm HH * * dd,dd"
    const weeklyMatch = value.match(/^(\d{1,2}) (\d{1,2}) \* \* ([\d,]+)$/);
    if (weeklyMatch) return trySetSimple('weekly', weeklyMatch[2].padStart(2, '0'), weeklyMatch[1].padStart(2, '0'), weeklyMatch[3].split(','));

    // Hourly: "0 * * * *"
    if (value === '0 * * * *') return trySetSimple('hourly');

    // Minute: "*/1 * * * *" or "* * * * *"
    if (value === '*/1 * * * *' || value === '* * * * *') return trySetSimple('minute');

    // Default to advanced for custom patterns
    setMode('advanced');
  }, [value]);

  // Sync prop from internal state (Internal -> External)
  useEffect(() => {
    if (mode === 'advanced') return;
    let cron = '* * * * *';
    if (freq === 'daily') cron = `${parseInt(min)} ${parseInt(hour)} * * *`;
    else if (freq === 'weekly') cron = `${parseInt(min)} ${parseInt(hour)} * * ${days.join(',')}`;
    else if (freq === 'hourly') cron = `0 * * * *`;
    else if (freq === 'minute') cron = `* * * * *`;

    if (cron !== value) {
      lastInternalValue.current = cron;
      onChange(cron);
    }
  }, [freq, hour, min, days, mode]);

  const btnStyle = (active) => ({
    padding: '6px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
    background: active ? 'var(--accent-btn)' : '#F1F5F9', color: active ? 'var(--accent-btn-text)' : '#475569',
    border: '1px solid', borderColor: active ? 'var(--accent-btn)' : '#E2E8F0', transition: 'all 0.15s'
  });

  return (
    <div style={{ background: '#F8F9FA', padding: 12, borderRadius: 10, border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, background: '#F1F5F9', padding: 3, borderRadius: 8 }}>
        <button onClick={() => setMode('simple')} style={{ ...btnStyle(mode === 'simple'), flex: 1, border: 'none' }}>Simple</button>
        <button onClick={() => setMode('advanced')} style={{ ...btnStyle(mode === 'advanced'), flex: 1, border: 'none' }}>Advanced</button>
      </div>

      {mode === 'advanced' ? (
        <Field label="Raw Cron Expression" hint="Standard 5-column crontab format.">
          <Input value={value} onChange={onChange} placeholder="* * * * *" />
        </Field>
      ) : (
        <>
          <Field label="Frequency">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['daily', 'weekly', 'hourly', 'minute'].map(f => (
                <button key={f} onClick={() => setFreq(f)} style={btnStyle(freq === f)}>{f.toUpperCase()}</button>
              ))}
            </div>
          </Field>

          {(freq === 'daily' || freq === 'weekly') && (
            <Field label="At Time (24h)">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Select value={hour} onChange={setHour} options={Array.from({ length: 24 }, (_, i) => ({ value: i.toString().padStart(2, '0'), label: i.toString().padStart(2, '0') }))} />
                <span style={{ fontWeight: 700 }}>:</span>
                <Select value={min} onChange={setMin} options={Array.from({ length: 60 }, (_, i) => ({ value: i.toString().padStart(2, '0'), label: i.toString().padStart(2, '0') }))} />
              </div>
            </Field>
          )}

          {freq === 'weekly' && (
            <Field label="On Days">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => {
                  const active = days.includes(i.toString());
                  return (
                    <button key={d} onClick={() => setDays(active ? days.filter(x => x !== i.toString()) : [...days, i.toString()])}
                      style={{ ...btnStyle(active), width: 36, padding: '6px 0' }}>{d[0]}</button>
                  );
                })}
              </div>
            </Field>
          )}

          <div style={{ fontSize: 11, color: '#64748B', marginTop: 8, fontStyle: 'italic', fontWeight: 500 }}>
            Generated Cron: <code style={{ color: '#0F172A', background: '#E2E8F0', padding: '2px 4px', borderRadius: 4 }}>{value}</code>
          </div>
        </>
      )}
    </div>
  );
}





function SensitivityClassifierConfig({ data, update, setShowGlobalRuleModal }) {
  {/* ── Sensitivity Classifier Node ── */ }

  const [advancedOpen, setAdvancedOpen] = React.useState(false);
  const engineMode = data.engine_mode ?? 'both';
  const outputFormat = data.output_format ?? 'markdown';

  const engineOptions = [
    { value: 'both', label: 'Presidio + Regex', sub: 'Best coverage' },
    { value: 'presidio', label: 'Presidio AI', sub: 'Semantic NLP' },
    { value: 'regex', label: 'Regex Only', sub: 'Fastest' },
  ];

  return (
    <>
      {/* ── ENGINE MODE pill switcher ── */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
          Detection Engine
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
          {engineOptions.map(opt => {
            const active = engineMode === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => update({ engine_mode: opt.value })}
                style={{
                  padding: '9px 6px',
                  borderRadius: 8,
                  border: active ? '1.5px solid var(--theme-primary)' : '1px solid var(--border)',
                  background: active ? 'rgba(142,119,187,0.08)' : 'white',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: active ? 'var(--theme-primary)' : 'var(--text-primary)' }}>
                  {opt.label}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                  {opt.sub}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── OUTPUT FORMAT ── */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
          Output Format
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[
            { value: 'markdown', label: 'Summary', icon: '📝', sub: 'Human-readable' },
            { value: 'json', label: 'Raw JSON', icon: '{ }', sub: 'Machine-readable' },
          ].map(opt => {
            const active = outputFormat === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => update({ output_format: opt.value })}
                style={{
                  padding: '10px 8px',
                  borderRadius: 8,
                  border: active ? '1.5px solid var(--theme-primary)' : '1px solid var(--border)',
                  background: active ? 'rgba(142,119,187,0.08)' : 'white',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 14, marginBottom: 3 }}>{opt.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: active ? 'var(--theme-primary)' : 'var(--text-primary)' }}>
                  {opt.label}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                  {opt.sub}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '2px 0 18px', opacity: 0.6 }} />

      {/* ── CUSTOM ENTITIES ── */}
      <Field
        label="Custom Entities"
        hint="Comma-separated keywords (e.g. Apollo11, ProjectX) or a JSON array of regex rules — applied only on this node."
      >
        <Textarea
          value={data.custom_entities ?? ''}
          onChange={(v) => update({ custom_entities: v })}
          placeholder={`e.g. Apollo11, ProjectX\nor: [{"pattern":"\\\\bUID-\\\\d{4}\\\\b","criticality":"HIGH"}]`}
          style={{ height: '80px', fontFamily: 'Roboto Mono, monospace', fontSize: 11 }}
        />
      </Field>

      {/* ── GLOBAL RULE BUTTON ── */}
      <button
        onClick={() => setShowGlobalRuleModal(true)}
        style={{
          width: '100%', marginTop: -6, marginBottom: 18,
          padding: '9px 12px',
          background: 'rgba(142,119,187,0.08)',
          border: '1px solid rgba(142,119,187,0.3)',
          borderRadius: 8,
          color: 'var(--theme-primary)',
          fontSize: 12, fontWeight: 700,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          transition: 'background 0.15s, border-color 0.15s',
          letterSpacing: '0.01em',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(142,119,187,0.16)'; e.currentTarget.style.borderColor = 'var(--theme-primary)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(142,119,187,0.08)'; e.currentTarget.style.borderColor = 'rgba(142,119,187,0.3)'; }}
      >
        <FiPlus size={13} /> Add Regex Rule
      </button>

      {/* ── ADVANCED SECTION (collapsible) ── */}
      <div
        style={{ borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}
      >
        <div
          onClick={() => setAdvancedOpen(o => !o)}
          style={{
            padding: '10px 14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#F8FAFC',
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiBox size={12} color="var(--text-muted)" /> ADVANCED — I/O ROUTING
          </span>
          <FiChevronDown size={14} style={{ color: 'var(--text-muted)', transform: advancedOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </div>
        {advancedOpen && (
          <div style={{ padding: '14px 14px 2px' }}>
            <Field label="Input Context Key" hint="Context key that holds the text to scan. Defaults to latest_ocr_output.">
              <Input
                value={data.classification_input_key ?? 'latest_ocr_output'}
                onChange={(v) => update({ classification_input_key: v })}
                placeholder="e.g. latest_ocr_output"
              />
            </Field>
            <Field label="Output Context Key" hint="Where to store the result dict. Leave blank to auto-name it.">
              <Input
                value={data.classification_output_key ?? ''}
                onChange={(v) => update({ classification_output_key: v })}
                placeholder="e.g. sensitivity_result"
              />
            </Field>
          </div>
        )}
      </div>

      {/* ── INFO FOOTER ── */}
      <div style={{ marginTop: 16, padding: 12, background: '#F8FAFC', borderRadius: 10, fontSize: 11, color: '#475569', lineHeight: 1.5, border: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <FiShield size={13} style={{ marginTop: 1, flexShrink: 0, color: 'var(--theme-primary)' }} />
        <span>Detects <strong>PII / PHI / PCI</strong> using Microsoft Presidio + custom regex. Runs 100% locally — no data leaves the server.</span>
      </div>
    </>
  );
}

// ── Doc-type categories per file extension (drives PDF layout etc.) ──────────
const DOC_TYPE_CATEGORIES = {
  '.docx': ['Letter', 'Certificate', 'Report', 'Contract', 'Invoice', 'Proposal'],
  '.pdf': ['Letter', 'Certificate', 'Report', 'Contract', 'Invoice'],
  '.xlsx': ['Report', 'Invoice', 'Tracker', 'Dashboard'],
  '.csv': ['Report', 'Tracker'],
  '.md': ['Report', 'Notes', 'Summary'],
  '.json': ['Report', 'Data Export'],
};

function ReportGeneratorConfig({ data, update }) {
  const [templates, setTemplates]           = useState([]);
  const [category, setCategory]             = useState(data.template_category || '');
  const [format, setFormat]                 = useState(data.report_format || data.file_format || '');
  const [deletingId, setDeletingId]         = useState(null);
  const [allCategories, setAllCategories]   = useState(['General']);
  const [customCatInput, setCustomCatInput] = useState('');
  const [showCustomCatInput, setShowCustomCatInput] = useState(false);
  const [advancedOpen, setAdvancedOpen]     = useState(false);
  const [filtersOpen, setFiltersOpen]       = useState(false);
  const [llmMode, setLlmMode]               = useState(data.llm_generation_mode || false);

  // Upload State
  const [showUpload, setShowUpload]         = useState(false);
  const [uploadName, setUploadName]         = useState('');
  const [uploadCategory, setUploadCategory] = useState('General');
  const [uploadCatCustom, setUploadCatCustom] = useState(false);
  const [uploadFiles, setUploadFiles]       = useState([]);
  const [uploading, setUploading]           = useState(false);

  const fetchTemplates = async () => {
    try {
      const query = new URLSearchParams();
      if (category) query.append('category', category);
      if (format)   query.append('format_type', format);
      const res = await fetch(`http://localhost:8000/api/v1/agentmesh/report-templates/?${query.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setTemplates(json);
        const dbCats = [...new Set((json).map(t => t.category).filter(Boolean))];
        const docTypeSuggestions = format ? (DOC_TYPE_CATEGORIES[format] || []) : [];
        const merged = [...new Set(['General', ...dbCats, ...docTypeSuggestions])];
        setAllCategories(merged);
      } else {
        console.error("Failed to fetch templates, status:", res.status);
      }
    } catch (err) {
      console.error("Failed to fetch report templates", err);
    }
  };

  useEffect(() => { fetchTemplates(); }, [category, format]);

  const handleUpload = async () => {
    if (!uploadName || uploadFiles.length === 0) return alert("Name and files are required");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('name', uploadName);
      formData.append('category', uploadCategory);
      const ext = '.' + uploadFiles[0].name.split('.').pop().toLowerCase();
      formData.append('format_type', ext);
      Array.from(uploadFiles).forEach(file => { formData.append('files', file); });
      const res = await fetch('http://localhost:8000/api/v1/agentmesh/report-templates/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const resData = await res.json();
        setShowUpload(false); setUploadName(''); setUploadFiles([]);
        fetchTemplates();
        if (resData.template_ids && resData.template_ids.length > 0) {
          update({ template_id: resData.template_ids[0] });
        }
      } else {
        const errorData = await res.json();
        alert(`Failed to upload: ${errorData.detail}`);
      }
    } catch (err) {
      console.error(err); alert("Network error while uploading.");
    }
    setUploading(false);
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm("Delete this template? This cannot be undone.")) return;
    setDeletingId(templateId);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/agentmesh/report-templates/${templateId}`, { method: 'DELETE' });
      if (res.ok) {
        if (data.template_id === templateId) update({ template_id: '' });
        fetchTemplates();
      } else {
        const err = await res.json();
        alert(`Failed to delete: ${err.detail}`);
      }
    } catch (err) {
      console.error(err); alert("Network error while deleting.");
    }
    setDeletingId(null);
  };

  const selectedTemplate = Array.isArray(templates) ? templates.find(t => t.id === data.template_id) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ÔöÇÔöÇ LLM MODE TOGGLE ÔöÇÔöÇ */}
      <div style={{
        padding: '0px 2px',
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)',
            }}>
              <FiCpu size={18} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              LLM Generation Mode
            </div>
          </div>
          <div style={{ marginBottom: -12 }}>
            <Toggle
              checked={llmMode}
              onChange={v => { 
                setLlmMode(v); 
                const updates = { llm_generation_mode: v };
                if (v && (!data.output_file_name || data.output_file_name === 'generated_report')) {
                  updates.output_file_name = 'llm_generated_report';
                }
                update(updates); 
              }}
            />
          </div>
        </div>
        {llmMode && (
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, paddingLeft: 38 }}>
            The AI will write and generate the entire document from scratch based on the context data.
          </div>
        )}
      </div>

      {/* ÔöÇÔöÇ TEMPLATE LIBRARY ÔöÇÔöÇ */}
        <>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 4, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FiFileText size={12} color="var(--accent-btn)" /> Template Selection
            </div>
          </div>
          {/* Format dropdown */}
          <Field label="Format Filter" hint="Filter the template list by file format.">
            <SearchableSelect
              showSearch={false}
              value={format}
              onChange={v => { setFormat(v); update({ report_format: v }); }}
              options={[
                { value: '',      label: 'All Formats' },
                { value: '.docx', label: 'Word (.docx)' },
                { value: '.xlsx', label: 'Excel (.xlsx)' },
                { value: '.pdf',  label: 'PDF (.pdf)' },
                { value: '.csv',  label: 'CSV (.csv)' },
                { value: '.json', label: 'JSON (.json)' },
                { value: '.md',   label: 'Markdown (.md)' },
              ]}
              placeholder="All Formats"
            />
          </Field>

          {/* Category dropdown */}
          <Field label="Category Filter" hint="Filter templates by category." action={
            <button
              onClick={() => setShowCustomCatInput(v => !v)}
              style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
            >
              <FiPlus size={11} /> New
            </button>
          }>
            {showCustomCatInput && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <input
                  value={customCatInput} onChange={e => setCustomCatInput(e.target.value)} autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter' && customCatInput.trim()) {
                      const newCat = customCatInput.trim();
                      setAllCategories(prev => prev.includes(newCat) ? prev : [...prev, newCat]);
                      setCategory(newCat); update({ template_category: newCat });
                      setCustomCatInput(''); setShowCustomCatInput(false);
                    }
                  }}
                  placeholder="New category name + Enter"
                  style={{ flex: 1, padding: '8px 12px', fontSize: 12, borderRadius: 8, border: '1px solid var(--accent-btn)', outline: 'none', fontFamily: 'inherit' }}
                />
                <button
                  onClick={() => {
                    if (customCatInput.trim()) {
                      const newCat = customCatInput.trim();
                      setAllCategories(prev => prev.includes(newCat) ? prev : [...prev, newCat]);
                      setCategory(newCat); update({ template_category: newCat });
                      setCustomCatInput(''); setShowCustomCatInput(false);
                    }
                  }}
                  style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: 'var(--accent-btn)', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >Add</button>
              </div>
            )}
            <SearchableSelect
              showSearch={false}
              value={category}
              onChange={v => { setCategory(v); update({ template_category: v }); }}
              options={[
                { value: '', label: 'All Categories' },
                ...allCategories.map(c => ({ value: c, label: c })),
              ]}
              placeholder="All Categories"
            />
          </Field>

          {/* Template list */}
          <Field label="Select Template" hint="Choose a template layout to generate into." action={
            <button
              onClick={() => setShowUpload(true)}
              style={{ fontSize: 11, padding: '5px 12px', background: 'var(--accent-btn)', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <FiUploadCloud size={13} /> Upload
            </button>
          }>
              <SearchableSelect
                value={data.template_id || ''}
                onChange={v => {
                  if (v === '' || v === 'auto') {
                    update({ template_id: v, output_file_name: v === 'auto' ? 'auto_generated_report' : 'generated_report' });
                  } else {
                    const t = (Array.isArray(templates) ? templates : []).find(temp => temp.id === v);
                    if (t) {
                      const baseName = t.name.split('.')[0].replace(/[^a-zA-Z0-9_-]/g, '_');
                      update({ template_id: t.id, report_format: t.format_type, output_file_name: baseName });
                      setFormat(t.format_type);
                    }
                  }
                }}
                options={[
                  { value: '', label: '­ƒôä Blank Document (No Template)' },
                  { value: 'auto', label: 'Ô£¿ Auto-Select Template via AI' },
                  ...(Array.isArray(templates) ? templates.map(t => ({
                    value: t.id,
                    label: t.name,
                    sublabel: `${(t.category || 'General').toUpperCase()} ÔÇ║ ${t.format_type}`,
                    onDelete: () => handleDeleteTemplate(t.id)
                  })) : [])
                ]}
                placeholder="Select a template..."
              />
            </Field>
        </>
      {/* ÔöÇÔöÇ I/O ROUTING (collapsible) ÔöÇÔöÇ */}
      <div style={{ borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 18 }}>
        <div onClick={() => setAdvancedOpen(o => !o)} style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card-neutral, #F8FAFC)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiBox size={12} color="var(--text-muted)" /> ADVANCED ÔÇö I/O ROUTING
          </span>
          <FiChevronDown size={14} style={{ color: 'var(--text-muted)', transform: advancedOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </div>
        {advancedOpen && (
          <div style={{ padding: '14px 14px 2px' }}>
            <Field label="Input Data Key" hint="Context key containing the JSON data to map into the template.">
              <Input value={data.input_data_key || 'report_data'} onChange={v => update({ input_data_key: v })} placeholder="e.g. report_data" />
            </Field>
            <Field label="Output File Base Name" hint="Base name for the generated file (no extension needed).">
              <Input value={data.output_file_name || 'generated_report'} onChange={v => update({ output_file_name: v })} placeholder="e.g. generated_report" />
            </Field>
          </div>
        )}
        {!advancedOpen && (
          <div style={{ padding: '8px 14px', fontSize: 11, color: 'var(--text-muted)' }}>
            Key: <strong>{data.input_data_key || 'report_data'}</strong> ÔåÆ File: <strong>{data.output_file_name || 'generated_report'}</strong>
          </div>
        )}
      </div>

      {/* ÔöÇÔöÇ AI SUBSTITUTION MODEL ÔöÇÔöÇ */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiZap size={12} color="var(--accent-btn)" /> AI Substitution Model
        </div>
        <div style={{ padding: '8px 12px', background: 'var(--bg-canvas)', borderRadius: 8, fontSize: 11, color: 'var(--text-muted)', border: '1px solid var(--border)', marginBottom: 12 }}>
          {llmMode
            ? 'LLM Mode ÔÇö The AI generates the entire document from scratch using the VFS.'
            : 'Used when your template has no {{placeholders}} ÔÇö the AI figures out what to replace.'}
        </div>
        <LLMConfigSection llm={data.llm} onChange={v => update({ llm: v })} />
      </div>

      {/* ÔöÇÔöÇ UPLOAD MODAL ÔöÇÔöÇ */}
      {showUpload && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: 20 }}>
          <div style={{ width: 440, background: 'white', borderRadius: 24, padding: 32, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative', border: '1px solid #E2E8F0' }}>
            <button onClick={() => setShowUpload(false)} style={{ position: 'absolute', top: 20, right: 20, background: '#F1F5F9', border: 'none', width: 32, height: 32, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}>
              <FiX size={16} strokeWidth={3} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg-hover)', color: 'var(--accent-btn)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiUploadCloud size={22} strokeWidth={2} />
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#0F172A' }}>Upload Template</div>
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>Add a new document to the library</div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Template Name</label>
              <Input value={uploadName} onChange={setUploadName} placeholder="e.g. Monthly Finance Report" />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Category</label>
              {uploadCatCustom ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input autoFocus value={uploadCategory} onChange={e => setUploadCategory(e.target.value)} placeholder="Type category name" style={{ flex: 1, ...{ width: '100%', padding: '9px 12px', background: 'white', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' } }} onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-btn)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
                  <button onClick={() => setUploadCatCustom(false)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: '#F1F5F9', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#64748B' }}>List</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 6 }}>
                  <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)} style={{ flex: 1, padding: '9px 12px', fontSize: 13, borderRadius: 8, background: 'white', border: '1px solid var(--border)', color: '#0F172A', outline: 'none', fontFamily: 'inherit' }}>
                    {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button onClick={() => { setUploadCatCustom(true); setUploadCategory(''); }} title="Type a new category" style={{ padding: '8px 12px', borderRadius: 8, border: '1px dashed var(--border)', background: '#F8FAFC', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--accent-btn)' }}><FiPlus size={13} /></button>
                </div>
              )}
              <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                Tip: Use <code style={{ background: '#F1F5F9', padding: '1px 4px', borderRadius: 4 }}>/</code> for subcategories (e.g. <em>HR / Offer Letters</em>).
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Select File(s)</label>
              <div style={{ border: '2px dashed var(--border)', borderRadius: 12, padding: '32px 20px', textAlign: 'center', background: uploadFiles.length > 0 ? '#F0FDF4' : '#F8FAFC', cursor: 'pointer', position: 'relative', transition: 'all 0.2s', borderColor: uploadFiles.length > 0 ? '#22C55E' : 'var(--border)' }}
                onMouseEnter={e => { if (uploadFiles.length === 0) { e.currentTarget.style.borderColor = 'var(--accent-btn)'; e.currentTarget.style.background = '#F0F4FF'; } }}
                onMouseLeave={e => { if (uploadFiles.length === 0) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = '#F8FAFC'; } }}
              >
                <input type="file" multiple onChange={e => { if (e.target.files.length > 0) { setUploadFiles(Array.from(e.target.files)); if (!uploadName) setUploadName(e.target.files[0].name.split('.')[0]); } }} style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', cursor: 'pointer', zIndex: 10 }} />
                {uploadFiles.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 18, background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiCheck size={18} strokeWidth={3} /></div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>{uploadFiles.length} file(s) selected ÔÇö Ready to upload</div>
                  </div>
                ) : (
                  <>
                    <FiUploadCloud size={26} color="var(--text-muted)" style={{ marginBottom: 8 }} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Click or drag files here</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Supports .docx, .xlsx, .pdf, .json, .md</div>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={handleUpload} disabled={uploading || !uploadName || uploadFiles.length === 0}
              style={{ width: '100%', padding: '12px', background: (uploading || !uploadName || uploadFiles.length === 0) ? '#E2E8F0' : 'var(--accent-btn)', color: (uploading || !uploadName || uploadFiles.length === 0) ? '#94A3B8' : 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: (uploading || !uploadName || uploadFiles.length === 0) ? 'not-allowed' : 'pointer', transition: 'opacity 0.2s' }}
              onMouseEnter={e => { if (!uploading && uploadName && uploadFiles.length > 0) e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              {uploading ? 'Uploading...' : 'Confirm & Save Template'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}









function VisualOperationsEditor({ value = [], onChange }) {
  const latestContext = useRunStore(s => s.latestContext) || {};
  const [aiOpen, setAiOpen] = React.useState(false);
  const [aiPrompt, setAiPrompt] = React.useState('');
  const [aiLoading, setAiLoading] = React.useState(false);

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

  const contextKeys = React.useMemo(() => {
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
    { value: 'flatten', label: 'Flatten Nested Lists' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10, marginBottom: 18 }}>
      {/* Architect Bot Assistant box */}
      <div style={{
        background: 'var(--bg-card-purple, #F5F3FF)',
        border: '1.5px solid rgba(139, 92, 246, 0.2)',
        borderRadius: 12,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }}>
        <div 
          onClick={() => setAiOpen(!aiOpen)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiZap size={12} /> ASK ARCHITECT BOT (AI WIZARD)
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{aiOpen ? 'Collapse' : 'Expand'}</span>
        </div>

        {aiOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Explain what you want to extract or modify in plain English... (e.g. 'Get run_name and test accuracy from job_status.tasks')"
              rows={3}
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: 11,
                border: '1px solid var(--border)',
                borderRadius: 8,
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit',
                background: 'white',
                color: 'var(--text-primary)'
              }}
            />
            <button
              onClick={handleAiGenerate}
              disabled={aiLoading || !aiPrompt.trim()}
              style={{
                padding: '8px 12px',
                background: '#7C3AED',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 700,
                cursor: (aiLoading || !aiPrompt.trim()) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
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
        <div key={idx} style={{
          padding: 14,
          background: 'var(--bg-card-neutral, #F8FAFC)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          position: 'relative',
          opacity: op.disabled ? 0.55 : 1,
          transition: 'all 0.2s'
        }}>
          {/* Card Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: op.disabled ? 'var(--text-muted, #94A3B8)' : 'var(--theme-primary)', letterSpacing: '0.05em' }}>
                STEP {idx + 1} {op.disabled && '(DISABLED)'}
              </span>
              <div
                onClick={() => updateOperation(idx, { disabled: !op.disabled })}
                style={{
                  width: 32, height: 18, borderRadius: 9, cursor: 'pointer', position: 'relative',
                  background: !op.disabled ? 'var(--accent-btn, #4285F4)' : 'var(--border, #e2e8f0)',
                  transition: 'all 0.2s', flexShrink: 0, display: 'inline-block'
                }}
                title={op.disabled ? "Enable Step" : "Disable Step"}
              >
                <div style={{
                  position: 'absolute', top: 2, left: !op.disabled ? 16 : 2, width: 14, height: 14,
                  borderRadius: '50%', background: '#fff', transition: 'left 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                disabled={idx === 0}
                onClick={() => moveOperation(idx, -1)}
                style={{ background: 'none', border: 'none', padding: 4, cursor: idx === 0 ? 'not-allowed' : 'pointer', color: 'var(--text-muted)' }}
                title="Move Up"
              >
                Ôû▓
              </button>
              <button
                disabled={idx === value.length - 1}
                onClick={() => moveOperation(idx, 1)}
                style={{ background: 'none', border: 'none', padding: 4, cursor: idx === value.length - 1 ? 'not-allowed' : 'pointer', color: 'var(--text-muted)' }}
                title="Move Down"
              >
                Ôû╝
              </button>
              <button
                onClick={() => removeOperation(idx)}
                style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}
                title="Remove Operation"
              >
                <FiTrash2 size={12} />
              </button>
            </div>
          </div>

          {/* Operation Type Selector */}
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>OPERATION TYPE</label>
            <select
              value={op.type}
              onChange={(e) => updateOperation(idx, { type: e.target.value })}
              style={{ ...inputStyle, padding: '6px 8px', fontSize: 12 }}
            >
              {opTypes.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Dynamic Configuration Fields */}
          {op.type === 'extract_field' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>SOURCE PATH (NESTED DICT/LIST)</label>
                <input
                  list="jt-context-keys"
                  value={op.source_path ?? ''}
                  onChange={(e) => updateOperation(idx, { source_path: e.target.value })}
                  placeholder="e.g. data.results"
                  style={{ ...inputStyle, padding: '6px 8px', fontSize: 12 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>TARGET FIELD</label>
                  <input
                    value={op.field ?? ''}
                    onChange={(e) => updateOperation(idx, { field: e.target.value })}
                    placeholder="e.g. status"
                    style={{ ...inputStyle, padding: '6px 8px', fontSize: 12 }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>DESTINATION KEY (ROOT)</label>
                  <input
                    value={op.destination ?? ''}
                    onChange={(e) => updateOperation(idx, { destination: e.target.value })}
                    placeholder="e.g. job_status"
                    style={{ ...inputStyle, padding: '6px 8px', fontSize: 12 }}
                  />
                </div>
              </div>
            </div>
          )}

          {op.type === 'filter' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>SOURCE LIST PATH</label>
                <input
                  list="jt-context-keys"
                  value={op.source_path ?? ''}
                  onChange={(e) => updateOperation(idx, { source_path: e.target.value })}
                  placeholder="e.g. data.items"
                  style={{ ...inputStyle, padding: '6px 8px', fontSize: 12 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                <div style={{ flex: 1.5 }}>
                  <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>FILTER FIELD</label>
                  <input
                    value={op.filter_field ?? ''}
                    onChange={(e) => updateOperation(idx, { filter_field: e.target.value })}
                    placeholder="e.g. status"
                    style={{ ...inputStyle, padding: '6px 8px', fontSize: 12 }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>OP</label>
                  <select
                    value={op.filter_operator ?? '=='}
                    onChange={(e) => updateOperation(idx, { filter_operator: e.target.value })}
                    style={{ ...inputStyle, padding: '6px 8px', fontSize: 12 }}
                  >
                    <option value="==">==</option>
                    <option value="!=">!=</option>
                    <option value="contains">contains</option>
                    <option value=">">&gt;</option>
                    <option value="<">&lt;</option>
                  </select>
                </div>
                <div style={{ flex: 1.5 }}>
                  <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>VALUE</label>
                  <input
                    value={op.filter_value ?? ''}
                    onChange={(e) => updateOperation(idx, { filter_value: e.target.value })}
                    placeholder="e.g. active"
                    style={{ ...inputStyle, padding: '6px 8px', fontSize: 12 }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>DESTINATION KEY (OPTIONAL)</label>
                <input
                  value={op.destination ?? ''}
                  onChange={(e) => updateOperation(idx, { destination: e.target.value })}
                  placeholder="e.g. filtered_items"
                  style={{ ...inputStyle, padding: '6px 8px', fontSize: 12 }}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>SOURCE LIST PATH</label>
                  <input
                    list="jt-context-keys"
                    value={op.source_path ?? ''}
                    onChange={(e) => updateOperation(idx, { source_path: e.target.value })}
                    placeholder="e.g. job_status.tasks"
                    style={{ ...inputStyle, padding: '6px 8px', fontSize: 12 }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0' }}>
                  <input
                    type="checkbox"
                    id={`jt-map-proj-${idx}`}
                    checked={isProjection}
                    onChange={(e) => toggleProjection(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor={`jt-map-proj-${idx}`} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
                    Construct custom objects (Object Projection)
                  </label>
                </div>

                {isProjection ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'rgba(0,0,0,0.02)', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>FIELD MAPPINGS</div>
                    {projections.map((proj, pIdx) => (
                      <div key={pIdx} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input
                          value={proj.target_path}
                          onChange={(e) => updateProj(pIdx, { target_path: e.target.value })}
                          placeholder="Target path (e.g. train.accuracy)"
                          style={{ ...inputStyle, padding: '5px 8px', fontSize: 11, flex: 1 }}
                        />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>&larr;</span>
                        <input
                          value={proj.source_field}
                          onChange={(e) => updateProj(pIdx, { source_field: e.target.value })}
                          placeholder="Source path (relative to item)"
                          style={{ ...inputStyle, padding: '5px 8px', fontSize: 11, flex: 1 }}
                        />
                        <button
                          onClick={() => removeProj(pIdx)}
                          style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}
                        >
                          <FiTrash2 size={11} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addProj}
                      style={{
                        padding: '6px',
                        background: 'white',
                        border: '1px dashed var(--border)',
                        borderRadius: 6,
                        fontSize: 10,
                        color: 'var(--accent-btn)',
                        cursor: 'pointer',
                        fontWeight: 600,
                        marginTop: 4
                      }}
                    >
                      + Add Field Mapping
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>FIELD TO EXTRACT</label>
                      <input
                        value={op.field ?? ''}
                        onChange={(e) => updateOperation(idx, { field: e.target.value })}
                        placeholder="e.g. email"
                        style={{ ...inputStyle, padding: '6px 8px', fontSize: 12 }}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>DESTINATION KEY</label>
                  <input
                    value={op.destination ?? ''}
                    onChange={(e) => updateOperation(idx, { destination: e.target.value })}
                    placeholder="e.g. user_emails"
                    style={{ ...inputStyle, padding: '6px 8px', fontSize: 12 }}
                  />
                </div>
              </div>
            );
          })()}

          {op.type === 'rename' && (
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>SOURCE KEY</label>
                <input
                  list="jt-context-keys"
                  value={op.source_path ?? ''}
                  onChange={(e) => updateOperation(idx, { source_path: e.target.value })}
                  placeholder="e.g. old_name"
                  style={{ ...inputStyle, padding: '6px 8px', fontSize: 12 }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>NEW KEY NAME</label>
                <input
                  value={op.destination ?? ''}
                  onChange={(e) => updateOperation(idx, { destination: e.target.value })}
                  placeholder="e.g. new_name"
                  style={{ ...inputStyle, padding: '6px 8px', fontSize: 12 }}
                />
              </div>
            </div>
          )}

          {op.type === 'set_value' && (
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>DESTINATION PATH</label>
                <input
                  value={op.destination ?? ''}
                  onChange={(e) => updateOperation(idx, { destination: e.target.value })}
                  placeholder="e.g. config.debug"
                  style={{ ...inputStyle, padding: '6px 8px', fontSize: 12 }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>STATIC VALUE</label>
                <input
                  value={op.static_value ?? ''}
                  onChange={(e) => updateOperation(idx, { static_value: e.target.value })}
                  placeholder="e.g. true"
                  style={{ ...inputStyle, padding: '6px 8px', fontSize: 12 }}
                />
              </div>
            </div>
          )}

          {op.type === 'delete_field' && (
            <div>
              <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>FIELD TO DELETE (ROOT)</label>
              <input
                list="jt-context-keys"
                value={op.field ?? ''}
                onChange={(e) => updateOperation(idx, { field: e.target.value })}
                placeholder="e.g. sensitive_field"
                style={{ ...inputStyle, padding: '6px 8px', fontSize: 12 }}
              />
            </div>
          )}

          {op.type === 'flatten' && (
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>SOURCE LIST OF LISTS</label>
                <input
                  list="jt-context-keys"
                  value={op.source_path ?? ''}
                  onChange={(e) => updateOperation(idx, { source_path: e.target.value })}
                  placeholder="e.g. nested_arrays"
                  style={{ ...inputStyle, padding: '6px 8px', fontSize: 12 }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>DESTINATION KEY</label>
                <input
                  value={op.destination ?? ''}
                  onChange={(e) => updateOperation(idx, { destination: e.target.value })}
                  placeholder="e.g. flat_array"
                  style={{ ...inputStyle, padding: '6px 8px', fontSize: 12 }}
                />
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={addOperation}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: '10px',
          background: 'none',
          border: '1.5px dashed var(--border)',
          borderRadius: 10,
          color: 'var(--accent-btn)',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-btn)'; e.currentTarget.style.background = 'var(--accent-glow)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'none'; }}
      >
        <FiPlus size={13} /> Add Transform Operation
      </button>
    </div>
  );
}
export default function PropertiesPanel() {
  const selectedNodeId = useUIStore((s) => s.selectedNodeId);
  const selectedEdgeId = useUIStore((s) => s.selectedEdgeId);
  const { nodes, edges } = useWorkflowStore();
  const setNodeData = useWorkflowStore((s) => s.setNodeData);
  const setEdgeData = useWorkflowStore((s) => s.setEdgeData);
  const removeNode = useWorkflowStore((s) => s.removeNode);
  const setEdges = useWorkflowStore((s) => s.setEdges);
  const setSelectedNode = useUIStore((s) => s.setSelectedNode);
  const setSelectedEdge = useUIStore((s) => s.setSelectedEdge);
  const workflows = useWorkflowStore((s) => s.allWorkflows);
  const currentWorkflowId = useWorkflowStore((s) => s.workflowId);

  const [availableTools, setAvailableTools] = useState([]);
  const [fixingGrammar, setFixingGrammar] = useState(false);
  const [skillGalleryOpen, setSkillGalleryOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [showGlobalRuleModal, setShowGlobalRuleModal] = useState(false);

  const handleFixGrammar = async (targetKey) => {
    if (!data[targetKey]) return;
    try {
      setFixingGrammar(true);
      const res = await fixGrammar(data[targetKey]);
      if (res.status === 'success' && res.fixed !== res.original) {
        setNodeData(selectedNodeId, { [targetKey]: res.fixed });
      }
    } catch (e) {
      console.error('Failed to fix grammar:', e);
    } finally {
      setFixingGrammar(false);
    }
  };

  useEffect(() => {
    listTools().then(res => {
      setAvailableTools(res.tools || []);
    }).catch(err => console.error('Failed to load tools:', err));
  }, []);

  const node = nodes.find((n) => n.id === selectedNodeId);
  const edge = edges.find((e) => e.id === selectedEdgeId);
  const data = node?.data;

  // 🔄 SMART SYNC: Automatically synchronize tools and settings between connected Agents and Tool Nodes
  const syncTools = (newTools, newConfigs) => {
    // 🧽 HEALING: Filter configs to only include tools that actually exist in the tools list
    const filteredConfigs = {};
    if (newConfigs) {
      newTools.forEach(tName => {
        if (newConfigs[tName]) filteredConfigs[tName] = newConfigs[tName];
      });
    }

    const patch = { tools: newTools, tool_configs: filteredConfigs };
    update(patch);

    if (['llm_agent', 'supervisor', 'swarm', 'deep_agent'].includes(data.type)) {
      // 1. Find directly connected Tool Nodes
      const connectedEdges = edges.filter(e => e.source === node.id);
      const connectedToolNodes = connectedEdges
        .map(e => nodes.find(n => n.id === e.target))
        .filter(n => n?.data?.type === 'tool_node');

      if (connectedToolNodes.length > 0) {
        // Push tools to all connected tool nodes
        connectedToolNodes.forEach(tn => setNodeData(tn.id, patch));
      } else if (newTools.length > 0) {
        // NO TOOL NODE CONNECTED! Create a dedicated one for this agent.
        const store = useWorkflowStore.getState();
        const newId = store.addNode('tool_node', { x: node.position.x + 350, y: node.position.y });

        setTimeout(() => {
          const currentEdges = useWorkflowStore.getState().edges;
          const newEdge = {
            id: `e-${node.id}-${newId}`,
            source: node.id,
            target: newId,
            type: 'smoothstep',
            animated: false,
            style: { stroke: '#CBD5E1', strokeWidth: 1.5 }
          };
          store.setEdgesDirty([...currentEdges, newEdge]);
          store.setNodeData(newId, patch);
        }, 50);
      }
    } else if (data.type === 'tool_node') {
      // If we update a Tool Node, push to all Agents that use it
      const incomingEdges = edges.filter(e => e.target === node.id);
      incomingEdges.forEach(e => {
        const sourceNode = nodes.find(n => n.id === e.source);
        if (['llm_agent', 'supervisor', 'swarm', 'deep_agent'].includes(sourceNode?.data?.type)) {
          setNodeData(sourceNode.id, patch);
        }
      });
    }
  };

  const syncToggle = (key, value) => {
    update({ [key]: value });
    if (['llm_agent', 'tool_node', 'deep_agent'].includes(data.type)) {
      const neighbors = [];
      if (data.type === 'tool_node') {
        edges.filter(e => e.target === node.id).forEach(e => {
          const s = nodes.find(n => n.id === e.source);
          if (['llm_agent', 'deep_agent'].includes(s?.data?.type)) neighbors.push(s);
        });
      } else {
        edges.filter(e => e.source === node.id).forEach(e => {
          const t = nodes.find(n => n.id === e.target);
          if (t?.data?.type === 'tool_node') neighbors.push(t);
        });
      }
      neighbors.forEach(n => setNodeData(n.id, { [key]: value }));
    }
  };

  if (!node && !edge) {
    return (
      <div style={{ padding: 40, color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
        <FiMousePointer size={32} style={{ color: 'var(--border)' }} />
        <div style={{ fontWeight: 600 }}>Select a node or edge to edit its properties</div>
      </div>
    );
  }

  // ── Edge Properties View ──
  if (edge) {
    const updateEdge = (patch) => setEdgeData(edge.id, patch);
    const removeEdge = () => setEdges(edges.filter(e => e.id !== edge.id));

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'white', fontFamily: FONT }}>
        <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED' }}>
              <FiLink size={15} strokeWidth={1.5} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Edge Properties</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{edge.source} &rarr; {edge.target}</div>
            </div>
          </div>
          <button
            onClick={() => { removeEdge(); setSelectedEdge(null); }}
            style={{ width: 30, height: 30, background: 'none', border: 'none', borderRadius: 6, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <FiTrash2 size={15} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          <div style={{ marginBottom: 20, padding: 12, background: '#F8F9FF', borderRadius: 10, fontSize: 11, color: '#6366F1', lineHeight: 1.5, border: '1px solid #E0E7FF' }}>
            <FiInfo size={11} style={{ marginRight: 5 }} />
            Conditional edges are used by <strong>Router</strong> nodes. If a node is not a Router, the edge acts as a standard flow connection.
          </div>

          <Field label="Condition Key" hint="The state key to check (e.g., 'next', 'status').">
            <Input
              value={edge.data?.condition?.key || ''}
              onChange={(v) => updateEdge({ condition: { ...(edge.data?.condition || { operator: '==' }), key: v } })}
              placeholder="e.g. next"
            />
          </Field>

          <Field label="Operator">
            <Select
              value={edge.data?.condition?.operator || '=='}
              onChange={(v) => updateEdge({ condition: { ...(edge.data?.condition || { key: '' }), operator: v } })}
              options={[
                { value: '==', label: 'Equals (==)' },
                { value: '!=', label: 'Not Equals (!=)' },
                { value: 'contains', label: 'Contains' },
                { value: '>', label: 'Greater Than (>)' },
                { value: '<', label: 'Less Than (<)' }
              ]}
            />
          </Field>

          <Field label="Match Value" hint="The value to compare against.">
            <Input
              value={edge.data?.condition?.value || ''}
              onChange={(v) => updateEdge({ condition: { ...(edge.data?.condition || { key: '', operator: '==' }), value: v } })}
              placeholder="e.g. true"
            />
          </Field>

          {edge.data?.condition?.key && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: '#F0FDF4', borderRadius: 8, border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }}></div>
              <div style={{ fontSize: 11, color: '#166534', fontWeight: 600 }}>Active Condition: {edge.data.condition.key} {edge.data.condition.operator} {edge.data.condition.value}</div>
            </div>
          )}
        </div>

        <div style={{ padding: 16, borderTop: '1px solid var(--border)', background: 'white' }}>
          <button
            onClick={() => { removeEdge(); setSelectedEdge(null); }}
            style={{
              width: '100%', padding: '12px', background: '#FEF2F2',
              border: '1px solid #FEE2E2', borderRadius: 10,
              color: '#EF4444', fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: 'pointer'
            }}
          >
            <FiTrash2 size={16} /> Remove Edge
          </button>
        </div>
      </div>
    );
  }

  const update = (patch) => setNodeData(selectedNodeId, patch);

  const nodeIcons = {
    llm_agent: FiCpu, tool_node: FiTool, router: FiGitMerge,
    supervisor: FiTarget, swarm: FiShare2,
    rag_node: FiBookOpen, subgraph: FiLink,
    chat_model: FiCpu, memory: FiBookOpen,
    webhook: FiGlobe, cron: FiClock, polling: FiClock,
    splitter: FiRepeat,
    api_node: FiGlobe,
    file_store: FiFileText,
    webhook_response: FiShare2,
    error_router: FiAlertTriangle,
    pattern_extract: FiSearch,
    db_node: FiBox,
    json_transform: FiCode,
    json_transform_va: FiCode,
    condition: FiHelpCircle,
  };
  const Icon = nodeIcons[data.type] || FiLayers;

  const isSystemNode = ['start', 'end'].includes(data.type);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'white', fontFamily: FONT }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <Icon size={15} strokeWidth={1.5} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Properties</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{data.type?.replace(/_/g, ' ')}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {['llm_agent', 'deep_agent', 'supervisor', 'swarm'].includes(data.type) && (
            <button
              onClick={() => setSaveModalOpen(true)}
              style={{ width: 30, height: 30, background: 'none', border: 'none', borderRadius: 6, color: 'var(--accent-btn)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
              title="Save as Agent Template"
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-glow)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              <FiSave size={15} />
            </button>
          )}
          {!isSystemNode && (
            <button
              onClick={() => { removeNode(selectedNodeId); setSelectedNode(null); }}
              style={{ width: 30, height: 30, background: 'none', border: 'none', borderRadius: 6, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
              title="Delete Node"
              onMouseEnter={(e) => { e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.background = '#FEF2F2'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
            >
              <FiTrash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {/* Common Label field (only for non-system nodes) */}
        {!isSystemNode && (
          <Field label="Node Label">
            <Input value={data.label} onChange={(v) => update({ label: v })} placeholder="Enter node name…" />
          </Field>
        )}

        {/* Node Specific Settings rendering starts here... */}
        {/* ── START / END ── */}
        {isSystemNode && (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, background: 'var(--bg-primary)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <FiInfo size={20} style={{ marginBottom: 8, opacity: 0.5 }} />
            <div>This is a <strong>{data.type.toUpperCase()}</strong> node and cannot be configured.</div>
          </div>
        )}


        {/* ── Sticky Note Visual Organizer ── */}
        {data.type === 'cardboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Sticky Note Theme" hint="Choose the color palette for this sticky note area.">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {[
                  { id: 'slate', name: 'Slate', color: '#64748B' },
                  { id: 'blue', name: 'Blue', color: '#3B82F6' },
                  { id: 'green', name: 'Green', color: '#22C55E' },
                  { id: 'purple', name: 'Purple', color: '#A855F7' },
                  { id: 'amber', name: 'Amber', color: '#F59E0B' },
                  { id: 'red', name: 'Red', color: '#EF4444' },
                  { id: 'pink', name: 'Pink', color: '#EC4899' }
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => update({ color: c.id })}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: c.color,
                      border: (data.color || 'slate') === c.id ? '2.5px solid #1E293B' : '1.5px solid transparent',
                      boxShadow: (data.color || 'slate') === c.id ? '0 0 0 2px rgba(99, 102, 241, 0.4)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      transform: (data.color || 'slate') === c.id ? 'scale(1.1)' : 'scale(1)',
                    }}
                    title={c.name}
                  />
                ))}
              </div>
            </Field>

            <Toggle
              checked={data.locked || false}
              onChange={(v) => update({ locked: v })}
              label="Lock Position & Size"
            />

            <Field label="Optional Description" hint="Explain the purpose of this visual grouping.">
              <Textarea
                value={data.description || ''}
                onChange={(v) => update({ description: v })}
                placeholder="Write summary notes about this area..."
                rows={4}
              />
            </Field>

            <div style={{
              background: '#F8FAFC',
              borderRadius: 12,
              padding: 16,
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Sticky Note Guide
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Sticky Note containers are purely visual tools used to group related nodes (like LLM Agents, databases, or API integrations) together on the canvas.
              </p>
              <ul style={{ fontSize: 11, color: 'var(--text-secondary)', paddingLeft: 18, margin: '0 0 4px 0', lineHeight: 1.6 }}>
                <li>Drag nodes inside this area to organize your workspace layout.</li>
                <li>When locked, it prevents accidental dragging or resizing.</li>
                <li>Double-click titles and descriptions to edit directly on the canvas, or use this sidebar.</li>
              </ul>
            </div>
          </div>
        )}

        {/* ── Webhook Trigger ── */}
        {data.type === 'webhook' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Toggle checked={data.enabled !== false} onChange={(v) => update({ enabled: v })} label="Trigger Enabled" />

              <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, background: '#F8FAFC' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Authentication</div>
                <Field label="Auth Method" hint="Header: Uses static secret in X-AgentMesh-Secret. HMAC: Uses SHA256 signature verification.">
                  <Select
                    value={data.auth_method || 'header'}
                    onChange={(v) => update({ auth_method: v })}
                    options={[
                      { value: 'header', label: 'Header (X-AgentMesh-Secret)' },
                      { value: 'hmac', label: 'HMAC Signature (X-AgentMesh-Signature)' },
                      { value: 'none', label: 'None (Public Endpoint)' }
                    ]}
                  />
                </Field>
                {(data.auth_method !== 'none') && (
                  <Field label="Secret Key" hint="Used for either Header or HMAC validation.">
                    <Input value={data.secret || ''} onChange={(v) => update({ secret: v })} placeholder="Enter secret key…" type="password" />
                  </Field>
                )}
              </div>

              <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, background: '#F0F9FF' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0369A1', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Response Settings</div>
                <Field label="Response Mode" hint="Immediate: Responds 202 Accepted instantly. On Completion: Waits for workflow to finish and returns its output.">
                  <Select
                    value={data.response_mode || 'immediate'}
                    onChange={(v) => update({ response_mode: v })}
                    options={[
                      { value: 'immediate', label: 'Immediate (Fire & Forget)' },
                      { value: 'on_completion', label: 'On Completion (Sync Response)' }
                    ]}
                  />
                </Field>
                {data.response_mode === 'on_completion' && (
                  <Field label="Return Data From" hint="Optional. Select a node to use its output as the response content. If empty, uses final workflow state.">
                    <SearchableSelect
                      value={data.response_node || ''}
                      onChange={(v) => update({ response_node: v })}
                      placeholder="— Final Output —"
                      options={[
                        { value: '', label: '— Final Output —' },
                        ...nodes
                          .filter(n => n.id !== selectedNodeId && n.data?.type !== 'start')
                          .map(n => ({
                            value: n.id,
                            label: n.data?.label || n.id,
                            sublabel: n.data?.type
                          }))
                      ]}
                    />
                  </Field>
                )}
              </div>

              <Field label="Webhook Path" hint="Custom path for the webhook. If empty, uses the Workflow ID.">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', background: '#F1F5F9', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>/webhook/</div>
                  <Input value={data.path || ''} onChange={(v) => update({ path: v })} placeholder="my-custom-path" />
                </div>
              </Field>

              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Webhook Endpoint</div>
                <div style={{
                  background: '#F8FAFC',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '12px 14px',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center'
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: '#64748B', marginBottom: 2, fontWeight: 600 }}>{data.response_mode === 'on_completion' ? 'SYNC' : 'ASYNC'} • POST / GET / PUT</div>
                    <div style={{
                      fontSize: 12,
                      color: '#1E293B',
                      fontFamily: 'monospace',
                      wordBreak: 'break-all',
                      lineHeight: 1.4
                    }}>
                      {`${window.location.origin}/api/v1/agentmesh/webhook/${data.path || useWorkflowStore.getState().workflowId}`}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/api/v1/agentmesh/webhook/${data.path || useWorkflowStore.getState().workflowId}`;
                      navigator.clipboard.writeText(url);
                      const btn = document.getElementById('copy-webhook-btn');
                      if (btn) {
                        btn.innerHTML = `<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="14" width="14" xmlns="http://www.w3.org/2000/svg"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                        setTimeout(() => {
                          btn.innerHTML = `<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="14" width="14" xmlns="http://www.w3.org/2000/svg"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
                        }, 2000);
                      }
                    }}
                    id="copy-webhook-btn"
                    style={{
                      width: 32, height: 32, borderRadius: 8, background: 'white',
                      border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0
                    }}
                    title="Copy URL"
                  >
                    <FiCopy size={14} />
                  </button>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 20, padding: 12, background: '#F0F9FF', borderRadius: 10, fontSize: 11, color: '#0369A1', lineHeight: 1.5, border: '1px solid #BAE6FD' }}>
              <FiInfo size={12} style={{ marginRight: 6 }} />
              {data.response_mode === 'on_completion'
                ? "Synchronous Mode: Caller waits for result. Use a 'Webhook Response' node to customize the output."
                : "Asynchronous Mode: Instant response. Workflow runs in background."
              }
            </div>
          </>
        )}

        {/* ── Webhook Response Node ── */}
        {data.type === 'webhook_response' && (
          <>
            <Field label="HTTP Status Code" hint="Set the status code for the synchronous webhook response (default: 200).">
              <Input type="number" value={data.response_status ?? 200} onChange={(v) => update({ response_status: parseInt(v) || 200 })} placeholder="200" />
            </Field>

            <KeyValueEditor
              label="Response Headers"
              value={data.response_headers || {}}
              onChange={(v) => update({ response_headers: v })}
              hint="Custom headers to return to the caller (e.g. Content-Type: text/plain)"
            />

            <Field label="Response Body Key" hint="Select a context key to use as the response body. If empty, returns the full context.">
              <Input
                value={data.response_body_key || ''}
                onChange={(v) => update({ response_body_key: v })}
                placeholder="e.g. final_report"
              />
            </Field>

            <div style={{ padding: 12, background: '#ECFDF5', borderRadius: 10, fontSize: 11, color: '#059669', lineHeight: 1.5, border: '1px solid #A7F3D0', marginTop: 10 }}>
              <FiShare2 size={12} style={{ marginRight: 6 }} />
              This node only has an effect if the Webhook Trigger is set to <strong>On Completion</strong> mode. It captures specific data and prepares the final HTTP response for the caller.
            </div>
          </>
        )}


        {/* ── Cron Trigger ── */}
        {data.type === 'cron' && (
          <>
            <Toggle checked={data.enabled !== false} onChange={(v) => update({ enabled: v })} label="Schedule Enabled" />
            <Field label="Schedule Configuration">
              <CronHelper value={data.cron_expression || ''} onChange={(v) => update({ cron_expression: v })} />
            </Field>
            <Field label="Timezone">
              <Select
                value={data.timezone || 'UTC'}
                onChange={(v) => update({ timezone: v })}
                options={['UTC', 'local', 'America/New_York', 'Europe/London', 'Asia/Tokyo']}
              />
            </Field>
            <div style={{ marginTop: 20, padding: 12, background: '#FFFBEB', borderRadius: 10, fontSize: 11, color: '#92400E', lineHeight: 1.5, border: '1px solid #FDE68A' }}>
              <FiClock size={12} style={{ marginRight: 6 }} />
              The Cron trigger automatically executes the workflow at specified intervals using the backend scheduler.
            </div>
          </>
        )}

        {/* ── Polling Trigger ── */}
        {data.type === 'polling' && (
          <>
            <Toggle checked={data.enabled !== false} onChange={(v) => update({ enabled: v })} label="Polling Enabled" />

            <Field label="Schedule Configuration">
              <CronHelper value={data.cron_expression || '*/5 * * * *'} onChange={(v) => update({ cron_expression: v })} />
            </Field>
            <Field label="Timezone">
              <Select
                value={data.timezone || 'UTC'}
                onChange={(v) => update({ timezone: v })}
                options={['UTC', 'local', 'America/New_York', 'Europe/London', 'Asia/Tokyo']}
              />
            </Field>

            <Field label="Poller Tool" hint="Choose the registered tool to query for data.">
              <SearchableSelect
                value={data.poller_tool || ''}
                onChange={(v) => update({ poller_tool: v })}
                placeholder="Select a poller tool…"
                options={availableTools.map(t => ({
                  value: t.name,
                  label: t.display_name || t.name,
                  sublabel: t.category
                }))}
              />
            </Field>

            {data.poller_tool && (() => {
              const selectedTool = availableTools.find(t => t.name === data.poller_tool);
              if (!selectedTool) return null;

              const schemaProperties = selectedTool.args || selectedTool.args_schema || {};
              const properties = schemaProperties.properties || schemaProperties;
              const requiredFields = Array.isArray(schemaProperties.required) ? schemaProperties.required : [];
              const hasArgs = Object.keys(properties).length > 0;

              return (
                <div style={{
                  marginBottom: 18,
                  padding: '14px 16px',
                  background: '#F8FAFC',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FiTool size={13} style={{ color: 'var(--accent-btn)' }} /> Tool Schema Details
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 12 }}>
                    {selectedTool.description || 'No description provided.'}
                  </div>

                  {hasArgs ? (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                        Expected Arguments
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {Object.entries(properties).map(([argName, argMeta]) => {
                          const isRequired = requiredFields.includes(argName) || argMeta.required;
                          return (
                            <div key={argName} style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 10px', background: 'white', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#0F172A' }}>{argName}</span>
                                <span style={{ fontSize: 9, color: '#6366F1', background: '#EEF2FF', padding: '1px 5px', borderRadius: 4, fontWeight: 600 }}>
                                  {argMeta.type || 'any'}
                                </span>
                                {isRequired && (
                                  <span style={{ fontSize: 9, color: '#EF4444', fontWeight: 600 }}>required</span>
                                )}
                              </div>
                              {argMeta.description && (
                                <div style={{ fontSize: 10, color: '#64748B', lineHeight: 1.4, marginTop: 2 }}>
                                  {argMeta.description}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: '#64748B', fontStyle: 'italic' }}>
                      This tool does not accept any arguments.
                    </div>
                  )}
                </div>
              );
            })()}

            <Field label="Destination Key" hint="The context key where the retrieved data list will be saved (default: 'payload').">
              <Input
                value={data.destination_key || 'payload'}
                onChange={(v) => update({ destination_key: v })}
                placeholder="payload"
              />
            </Field>

            <KeyValueEditor
              label="Tool Arguments (JSON Parameters)"
              value={data.tool_arguments || {}}
              onChange={(v) => update({ tool_arguments: v })}
              hint="Key-value arguments to supply to the poller tool on every execution."
            />

            <div style={{ marginTop: 20, padding: 12, background: '#FFFDF5', borderRadius: 10, fontSize: 11, color: '#854D0E', lineHeight: 1.5, border: '1px solid #FEF08A' }}>
              <FiClock size={12} style={{ marginRight: 6 }} />
              The Polling trigger runs the selected tool on a scheduled interval without an LLM. If new items are returned, it starts a workflow run.
            </div>
          </>
        )}

        {/* ── LLM Agent ── */}
        {data.type === 'llm_agent' && (
          <>
            {/* 1. Node Label (Rendered above if not system node) */}

            {/* 2. System Instructions */}
            <Field
              label="System Instructions"
              hint="Define the agent's core role, persona, and behavior rules. This is the 'soul' of the agent."
              action={
                <WizardButton
                  onClick={() => handleFixGrammar('task')}
                  loading={fixingGrammar}
                  disabled={!data.task}
                />
              }
            >
              <Textarea value={data.task} onChange={(v) => update({ task: v })} placeholder="You are a helpful assistant that…" rows={7} />
            </Field>

            {/* 3. LLM Configuration */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiCpu size={12} /> Model Settings
              </div>
              <LLMConfigSection
                llm={data.llm || { provider: 'groq', model: 'llama-3.3-70b-versatile', temperature: 0 }}
                onChange={(llm) => update({ llm })}
              />
            </div>

            {/* 4. Tools */}
            <Field label="Agent Tools" hint="Assign specific capabilities to this agent. These are auto-synced with connected Tool Nodes.">
              <ToolTagInput
                value={data.tools || []}
                configs={data.tool_configs || {}}
                onUpdate={syncTools}
                availableTools={availableTools}
              />
            </Field>

            {/* 5. Memory Configuration */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiBookOpen size={12} /> Memory & History
              </div>
              <Field label="Memory Type" hint="Buffer: keeps last N messages. Vector: uses semantic search for long-term recall. None: stateless.">
                <Select
                  value={data.memory?.type_name || 'buffer_memory'}
                  onChange={(v) => update({ memory: { ...data.memory, type_name: v } })}
                  options={[
                    { value: 'buffer_memory', label: 'Buffer Memory (Recent context)' },
                    { value: 'summary_buffer_memory', label: 'Summary Memory (Condensed)' },
                    { value: 'vector_memory', label: 'Vector Memory (Semantic recall)' },
                    { value: 'none', label: 'No Memory (One-shot / Stateless)' },
                  ]}
                />
              </Field>
              {(data.memory?.type_name || 'buffer_memory') !== 'none' && (
                <Field label="Memory Scope" hint="Unified: shares conversation history. Isolated: only remembers this agent's actions/tools.">
                  <Select
                    value={data.memory?.scope || 'unified'}
                    onChange={(v) => update({ memory: { ...data.memory, scope: v } })}
                    options={[
                      { value: 'unified', label: 'Unified (Shared history)' },
                      { value: 'isolated', label: 'Isolated (Private history)' },
                    ]}
                  />
                </Field>
              )}
              {((data.memory?.type_name || 'buffer_memory') !== 'vector_memory' && (data.memory?.type_name || 'buffer_memory') !== 'none') && (
                <Field label="Window Size" hint="How many previous messages the agent remembers. Larger windows use more tokens.">
                  <Input type="number" value={data.memory?.window_size ?? 10} onChange={(v) => update({ memory: { ...data.memory, window_size: parseInt(v) || 10 } })} placeholder="10" />
                </Field>
              )}
            </div>

            {/* 6. ADVANCED OPTIONS (Accordion) */}
            <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
              <div
                onClick={() => {
                  const el = document.getElementById('advanced-options-agent');
                  const arrow = document.getElementById('advanced-arrow-agent');
                  if (el.style.display === 'none') {
                    el.style.display = 'block';
                    arrow.style.transform = 'rotate(180deg)';
                  } else {
                    el.style.display = 'none';
                    arrow.style.transform = 'rotate(0deg)';
                  }
                }}
                style={{
                  padding: '12px 16px', background: '#F8FAFC', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderBottom: '1px solid var(--border)'
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiSettings size={14} color="var(--accent-btn)" /> Advanced Options
                </div>
                <FiChevronDown id="advanced-arrow-agent" size={14} style={{ color: 'var(--text-muted)', transition: 'transform 0.2s' }} />
              </div>

              <div id="advanced-options-agent" style={{ display: 'none', padding: '16px', background: 'var(--bg-panel, white)' }}>
                {/* 6a. Data Subscriptions (Pub/Sub) */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>Data Subscriptions (Pub/Sub)</div>
                  <Field label="Subscription Filters (JSON Array/Object)" hint="If provided, the agent will filter the input array and ONLY execute if matches are found.">
                    <Textarea 
                      value={typeof data.subscription_filters === 'string' ? data.subscription_filters : data.subscription_filters ? JSON.stringify(data.subscription_filters, null, 2) : ''} 
                      onChange={(v) => update({ subscription_filters: v })}
                      placeholder='{\n  "class": ["BALANCE_SHEET"]\n}'
                      rows={4}
                    />
                  </Field>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <Field label="Input Array Key" hint="The context key containing the array to filter.">
                        <Input value={data.subscription_input_key !== undefined ? data.subscription_input_key : 'aggregated_results'} onChange={(v) => update({ subscription_input_key: v })} placeholder="aggregated_results" />
                      </Field>
                    </div>
                    <div style={{ flex: 1 }}>
                      <Field label="Output Data Key" hint="Where the matched data is stored for the prompt.">
                        <Input value={data.subscription_output_key || ''} onChange={(v) => update({ subscription_output_key: v })} placeholder="latest_ocr_output" />
                      </Field>
                    </div>
                  </div>
                </div>

                <div style={{ height: '1px', background: 'var(--border)', margin: '16px 0' }} />

                {/* 6b. Human-in-the-Loop */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>Human-in-the-Loop</div>
                  <Toggle
                    checked={data.interrupt_before === true}
                    onChange={(v) => update({ interrupt_before: v })}
                    label="Pause Before Execution"
                  />
                  <Toggle
                    checked={data.interrupt_after === true}
                    onChange={(v) => update({ interrupt_after: v })}
                    label="Pause After Completion"
                  />
                  {(data.interrupt_before || data.interrupt_after) && (
                    <div style={{ marginTop: 10, paddingLeft: 12, borderLeft: '2px solid var(--accent-glow)' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>Allowed Actions</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {['approve', 'rework', 'reject'].map(action => {
                          const isChecked = (data.hitl_actions || ['approve', 'rework', 'reject']).includes(action);
                          return (
                            <label key={action} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const actions = data.hitl_actions || ['approve', 'rework', 'reject'];
                                  update({ hitl_actions: e.target.checked ? [...new Set([...actions, action])] : actions.filter(a => a !== action) });
                                }}
                              />
                              <span style={{ textTransform: 'capitalize' }}>{action}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ height: '1px', background: 'var(--border)', margin: '16px 0' }} />

                {/* 6b. Iteration & Self-Correction */}
                <div style={{ marginBottom: 20 }}>
                  <IterationConfigSection
                    policy={data.iteration_policy}
                    onChange={(policy) => update({ iteration_policy: policy })}
                  />
                </div>

                <div style={{ height: '1px', background: 'var(--border)', margin: '16px 0' }} />

                {/* 6c. Routing & Execution */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>Routing & Execution</div>
                  <Field label="Routing Key" hint="Optional: Save the agent's output into this state key (e.g. 'intent') to determine the next path in conditional edges.">
                    <Input value={data.routing_key || ''} onChange={(v) => update({ routing_key: v })} placeholder="e.g. intent" />
                  </Field>
                  <Toggle checked={data.return_direct} onChange={(v) => syncToggle('return_direct', v)} label="Return result direct to user" />
                </div>

                <div style={{ height: '1px', background: 'var(--border)', margin: '16px 0' }} />

                {/* 6d. Error & Recovery */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>Error & Recovery</div>
                  <Field label="Error Target (On Failure)" hint="If this node fails, jump to this specific error handler node. If empty, uses the global workflow handler.">
                    <SearchableSelect
                      value={data.on_error || ''}
                      onChange={(v) => update({ on_error: v })}
                      placeholder="— Use Global Handler —"
                      options={[
                        { value: '', label: '— Use Global Handler —' },
                        ...nodes
                          .filter(n => n.id !== selectedNodeId && !['start', 'end'].includes(n.data?.type))
                          .map(n => ({
                            value: n.id,
                            label: n.data?.label || n.id,
                            sublabel: n.data?.type
                          }))
                      ]}
                    />
                  </Field>
                </div>

                <div style={{ height: '1px', background: 'var(--border)', margin: '16px 0' }} />

                {/* 6e. Data Serialization Options */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>Data Serialization Options</div>
                  <Field label="Agent Input Prefix" hint="Prefix for context keys to inject into the agent prompt (default: 'agent_input_').">
                    <Input value={data.agent_input_prefix !== undefined ? data.agent_input_prefix : 'agent_input_'} onChange={(v) => update({ agent_input_prefix: v })} placeholder="agent_input_" />
                  </Field>
                  <Field label="Output Key Prefix" hint="Prefix used when saving the agent's output back to context (default: 'cd_output_').">
                    <Input value={data.output_key_prefix !== undefined ? data.output_key_prefix : 'cd_output_'} onChange={(v) => update({ output_key_prefix: v })} placeholder="cd_output_" />
                  </Field>
                </div>
              </div>
            </div>

            {/* Swarm membership info (Special Context) */}
            {nodes.some(n => n.data?.type === 'swarm' && (n.data?.member_ids || []).includes(selectedNodeId)) && (
              <div style={{ marginTop: 8, marginBottom: 20, padding: 14, background: '#FDF2F8', borderRadius: 12, border: '1px solid #FBCFE8' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9D174D', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Swarm Handoff Rules</div>
                <Field label="Allowed Handoffs" hint="Restrict which other swarm members this agent can transfer control to.">
                  <NodeIdList
                    value={data.allowed_transitions || []}
                    onChange={(ids) => update({ allowed_transitions: ids.length > 0 ? ids : null })}
                    allNodes={nodes}
                  />
                </Field>
              </div>
            )}
          </>
        )}

        {/* ── Deep Agent ── */}
        {data.type === 'deep_agent' && (
          <>
            <Field
              label="System Instructions"
              hint="The high-level objective and behavioral rules. The Deep Agent will use this to generate its own sub-tasks and to-do list."
              action={
                <WizardButton
                  onClick={() => handleFixGrammar('task')}
                  loading={fixingGrammar}
                  disabled={!data.task}
                />
              }
            >
              <Textarea value={data.task} onChange={(v) => update({ task: v })} placeholder="e.g. Research the latest 2026 AI trends and write a report..." rows={5} />
            </Field>

            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiCpu size={12} /> Reasoning Model
              </div>
              <LLMConfigSection
                llm={data.llm || { provider: 'groq', model: 'llama-3.3-70b-versatile', temperature: 0 }}
                onChange={(llm) => update({ llm })}
              />
            </div>

            <Field label="Autonomous Subagents" hint="Select other nodes in this mesh that this Deep Agent can delegate tasks to.">
              <NodeIdList
                value={data.subagents || []}
                onChange={(ids) => update({ subagents: ids })}
                allNodes={nodes}
              />
            </Field>

            <Field label="Managed Tools" hint="Tools given to the Deep Agent for its research loops. Synced with connected Tool Nodes.">
              <ToolTagInput
                value={data.tools || []}
                configs={data.tool_configs || {}}
                onUpdate={syncTools}
                availableTools={availableTools}
              />
            </Field>

            <Field
              label="Skills & Expertise"
              hint="Selected SOP domains this agent can access for professional reasoning. Click 'Browse' to add more."
              action={
                <button
                  onClick={() => setSkillGalleryOpen(true)}
                  style={{
                    padding: '4px 10px', background: '#F5F3FF', color: '#8B5CF6',
                    borderRadius: 6, fontSize: 10, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, border: 'none'
                  }}
                >
                  <FiBookOpen size={10} /> BROWSE GALLERY
                </button>
              }
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(!data.skills || data.skills.length === 0) && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 0' }}>No skills applied yet.</div>
                )}
                {/* Multi-skill support */}
                {(data.skills || []).map(skillPath => {
                  const label = skillPath.split('/').pop().replace(/-/g, ' ').toUpperCase();
                  return (
                    <div key={skillPath} style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
                      background: 'white', border: '1px solid var(--border)', borderRadius: 20,
                      fontSize: 10, fontWeight: 700, color: 'var(--text-primary)'
                    }}>
                      <FiZap size={10} color="#8B5CF6" />
                      {label}
                      <button
                        onClick={() => {
                          const newSkills = (data.skills || []).filter(s => s !== skillPath);
                          update({ skills: newSkills });
                        }}
                        style={{ border: 'none', background: 'none', padding: 2, cursor: 'pointer', color: 'var(--text-muted)' }}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </Field>




            {/* 7. Advanced Options (Accordion) */}
            <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
              <div
                onClick={() => {
                  const el = document.getElementById('advanced-options-deep');
                  const arrow = document.getElementById('advanced-arrow-deep');
                  if (el.style.display === 'none') {
                    el.style.display = 'block';
                    arrow.style.transform = 'rotate(180deg)';
                  } else {
                    el.style.display = 'none';
                    arrow.style.transform = 'rotate(0deg)';
                  }
                }}
                style={{
                  padding: '12px 16px', background: '#F8FAFC', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderBottom: '1px solid var(--border)'
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiSettings size={14} color="var(--accent-btn)" /> Planning Limits
                </div>
                <FiChevronDown id="advanced-arrow-deep" size={14} style={{ color: 'var(--text-muted)', transition: 'transform 0.2s' }} />
              </div>

              <div id="advanced-options-deep" style={{ display: 'none', padding: '16px', background: 'white' }}>
                <Field label="Max Reasoning Steps" hint="Limits the number of autonomous task updates.">
                  <Input type="number" value={data.max_iterations ?? 10} onChange={(v) => update({ max_iterations: parseInt(v) || 10 })} placeholder="10" />
                </Field>
                <Field label="Timeout (Seconds)">
                  <Input type="number" value={data.timeout_seconds ?? 300} onChange={(v) => update({ timeout_seconds: parseInt(v) || 300 })} placeholder="300" />
                </Field>

                <div style={{ height: '1px', background: 'var(--border)', margin: '16px 0' }} />

                {/* Human-in-the-Loop */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>Human-in-the-Loop</div>
                  <Toggle
                    checked={data.interrupt_before === true}
                    onChange={(v) => update({ interrupt_before: v })}
                    label="Pause Before Execution"
                  />
                  <Toggle
                    checked={data.interrupt_after === true}
                    onChange={(v) => update({ interrupt_after: v })}
                    label="Pause After Completion"
                  />
                </div>

                <div style={{ height: '1px', background: 'var(--border)', margin: '16px 0' }} />

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>Routing & Execution</div>
                  <Field label="Routing Key" hint="Optional key for conditional branching.">
                    <Input value={data.routing_key || ''} onChange={(v) => update({ routing_key: v })} placeholder="e.g. intent" />
                  </Field>
                  <Toggle checked={data.return_direct} onChange={(v) => syncToggle('return_direct', v)} label="Return result direct to user" />
                </div>

                <div style={{ height: '1px', background: 'var(--border)', margin: '16px 0' }} />

                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>Error & Recovery</div>
                  <Field label="Error Target (On Failure)">
                    <SearchableSelect
                      value={data.on_error || ''}
                      onChange={(v) => update({ on_error: v })}
                      placeholder="— Use Global Handler —"
                      options={[
                        { value: '', label: '— Use Global Handler —' },
                        ...nodes
                          .filter(n => n.id !== selectedNodeId && !['start', 'end'].includes(n.data?.type))
                          .map(n => ({
                            value: n.id,
                            label: n.data?.label || n.id,
                            sublabel: n.data?.type
                          }))
                      ]}
                    />
                  </Field>
                </div>
              </div>
            </div>
          </>
        )}
        {(data.type === 'button_trigger' || data.type === 'auto_trigger') && (
          <>
            {data.type === 'button_trigger' && (
              <>
                <Field label="Button Label" hint="The text displayed on the button in the Run Panel.">
                  <Input value={data.button_label || 'Start Workflow'} onChange={(v) => update({ button_label: v })} placeholder="e.g. Generate Report" />
                </Field>
                <Field label="Button Theme/Style" hint="Determine the color coding of the button.">
                  <Select
                    value={data.button_category || 'action'}
                    onChange={(v) => update({ button_category: v })}
                    options={[
                      { value: 'action', label: 'Action (Indigo Theme)' },
                      { value: 'info', label: 'Info (Blue)' },
                      { value: 'help', label: 'Help (Purple)' },
                      { value: 'success', label: 'Success (Green)' },
                      { value: 'reject', label: 'Reject (Orange)' },
                      { value: 'delete', label: 'Delete (Red)' }
                    ]}
                  />
                </Field>
              </>
            )}
            <Field label="Initial Input" hint={data.type === 'button_trigger' ? "The text sent to the workflow when the button is clicked." : "The text sent to the workflow when triggered automatically."}>
              <Textarea value={data.button_input || 'Start'} onChange={(v) => update({ button_input: v })} placeholder={data.type === 'button_trigger' ? "e.g. Please generate the daily report" : "e.g. Auto run workflow"} rows={3} />
            </Field>
            <div style={{ padding: 12, background: '#F0F9FF', borderRadius: 10, fontSize: 11, color: '#0369A1', lineHeight: 1.5, border: '1px solid #BAE6FD' }}>
              <FiInfo size={12} style={{ marginRight: 6 }} />
              {data.type === 'button_trigger'
                ? 'This node creates a clickable button in the chat interface for quick execution.'
                : 'This node triggers the workflow automatically as soon as the user launches/opens it.'}
            </div>
          </>
        )}

        {/* ── Condition Node ── */}
        {data.type === 'condition' && (
          <>
            <Field label="Condition Expression" hint="Evaluate state variables using Python logic. Tip: Use variable names directly (e.g. value == 1) or check the message with 'msg'.">
              <Textarea
                value={data.condition || ''}
                onChange={(v) => update({ condition: v })}
                placeholder="value == 'approve' or 'ready' in msg"
                rows={4}
              />
            </Field>
            <LogicHelper />
            <div style={{ padding: 12, background: '#FFFBEB', borderRadius: 10, fontSize: 11, color: '#92400E', lineHeight: 1.5, border: '1px solid #FDE68A', marginTop: 10 }}>
              <FiInfo size={12} style={{ marginRight: 6 }} />
              Connect two edges from this node. Label one <strong>true</strong> and the other <strong>false</strong>.
            </div>
          </>
        )}

        {/* ── Wait Node ── */}
        {data.type === 'wait' && (
          <>
            <Field label="Wait Duration (Seconds)" hint="Workflow will pause for this many seconds before continuing.">
              <Input
                type="number"
                value={data.wait_seconds ?? 0}
                onChange={(v) => update({ wait_seconds: v })}
                placeholder="e.g. 60"
              />
            </Field>
            <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 10, fontSize: 11, color: '#475569', lineHeight: 1.5, border: '1px solid var(--border)', marginTop: 10 }}>
              <FiInfo size={12} style={{ marginRight: 6 }} />
              Useful for rate limiting or waiting for external processes to settle.
            </div>
          </>
        )}

        {/* ── Join Node ── */}
        {data.type === 'join' && (
          <div style={{ padding: 16, background: '#ECFDF5', borderRadius: 12, fontSize: 12, color: '#065F46', border: '1px solid #A7F3D0', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiShare2 size={14} /> SYNCHRONIZATION POINT
            </div>
            Use this node to merge parallel branches. The workflow will continue once all incoming parallel paths have reached this point.
          </div>
        )}

        {/* ── Switch Node ── */}
        {data.type === 'switch' && (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 12 }}>Logical Branches</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(data.branches || []).map((branch, idx) => (
                <div key={idx} style={{ padding: 12, background: '#F8FAFC', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>BRANCH {idx + 1}</div>
                    <button
                      onClick={() => {
                        const newBranches = [...(data.branches || [])];
                        newBranches.splice(idx, 1);
                        update({ branches: newBranches });
                      }}
                      style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}
                    >
                      <FiTrash2 size={12} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Field label="Path Name" hint="Appears on the canvas port">
                      <Input
                        value={branch.name || ''}
                        onChange={(v) => {
                          const newBranches = [...(data.branches || [])];
                          newBranches[idx] = { ...newBranches[idx], name: v };
                          update({ branches: newBranches });
                        }}
                        placeholder="e.g. gold_member"
                      />
                    </Field>
                    <Field label="Condition" hint="Python logic. Tip: Use keys directly (e.g. status == 'ok') or text searches like 'pass' in msg.">
                      <Textarea
                        value={branch.condition || ''}
                        onChange={(v) => {
                          const newBranches = [...(data.branches || [])];
                          newBranches[idx] = { ...newBranches[idx], condition: v };
                          update({ branches: newBranches });
                        }}
                        placeholder="total > 1000 or 'urgent' in msg"
                        rows={2}
                      />
                    </Field>
                  </div>
                </div>
              ))}
              <LogicHelper />
              <button
                onClick={() => {
                  const newBranches = [...(data.branches || []), { name: `Path ${(data.branches?.length || 0) + 1}`, condition: '' }];
                  update({ branches: newBranches });
                }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '10px', borderRadius: 10, border: '1px dashed #CBD5E1',
                  background: 'white', color: '#64748B', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', marginTop: 8
                }}
              >
                <FiPlus size={14} /> Add Branch
              </button>
            </div>
            <div style={{ padding: 12, background: '#F1F5F9', borderRadius: 10, fontSize: 11, color: '#475569', lineHeight: 1.5, border: '1px solid var(--border)', marginTop: 16 }}>
              <FiInfo size={12} style={{ marginRight: 6 }} />
              The workflow routes to the <strong>first</strong> branch that evaluates to True. If none match, it follows the <strong>ELSE</strong> path.
            </div>
          </>
        )}

        {/* ── Set Data Node ── */}
        {data.type === 'set_data' && (
          <div style={{ paddingTop: 8 }}>
            <Field label="Custom Message" hint="The static text this node will output.">
              <textarea
                value={data.message || ''}
                onChange={(e) => update({ message: e.target.value })}
                placeholder="Hello! How can I help you today?"
                style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
              />
            </Field>
            <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 10, fontSize: 11, color: '#64748B', lineHeight: 1.5, border: '1px solid var(--border)', marginTop: 16 }}>
              <FiInfo size={12} style={{ marginRight: 6 }} />
              Use this to inject static responses into the conversation without using an LLM.
            </div>
          </div>
        )}

        {/* ── Output Parser Node ── */}
        {data.type === 'output_parser' && (
          <div style={{ paddingTop: 8 }}>
            <Field label="Parse Mode" hint="'auto' tries standard then repairs, 'json' forces JSON, 'strict' fails on error.">
              <Select
                value={data.parse_mode || 'auto'}
                onChange={(v) => update({ parse_mode: v })}
                options={[
                  { value: 'auto', label: 'Auto (smart fallback)' },
                  { value: 'json', label: 'Force JSON' },
                  { value: 'strict', label: 'Strict (fail on error)' },
                ]}
              />
            </Field>
            <Field label="Fallback to Raw" hint="If parsing fails, return original message instead of error.">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={data.fallback_to_raw !== false}
                  onChange={(e) => update({ fallback_to_raw: e.target.checked })}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>Return raw data on parse failure</span>
              </div>
            </Field>
            <Field label="Context Key (Optional)" hint="Key to store parsed result in context (default: parsed_output). Leave blank to use default.">
              <Input
                value={data.output_context_key || ''}
                onChange={(v) => update({ output_context_key: v || undefined })}
                placeholder="parsed_output"
              />
            </Field>
            <div style={{ padding: 12, background: '#FEF3C7', borderRadius: 10, fontSize: 11, color: '#92400E', lineHeight: 1.5, border: '1px solid #FDE68A', marginTop: 16 }}>
              <FiFilter size={12} style={{ marginRight: 6, display: 'inline' }} />
              Automatically reads latest message and repairs malformed JSON: fixes missing quotes, trailing commas, unquoted keys, etc. Result stored in context automatically.
            </div>
          </div>
        )}

        {/* ── Chat Model ── */}
        {data.type === 'chat_model' && (
          <div style={{ paddingTop: 8 }}>
            <LLMConfigSection
              llm={{ provider: data.provider, model: data.model, temperature: data.temperature, api_key_override: data.api_key_override }}
              onChange={(llm) => update({ ...llm })}
            />
          </div>
        )}

        {/* ── Memory Node ── */}
        {data.type === 'memory' && (
          <div style={{ paddingTop: 8 }}>
            <Field label="Memory Type">
              <Select
                value={data.type_name || 'buffer_memory'}
                onChange={(v) => update({ type_name: v })}
                options={[
                  { value: 'buffer_memory', label: 'Buffer Memory (last N messages)' },
                  { value: 'summary_buffer_memory', label: 'Summary Buffer (compressed)' },
                  { value: 'vector_memory', label: 'Vector Memory (semantic)' },
                  { value: 'none', label: 'No Memory (One-shot / Stateless)' },
                ]}
              />
            </Field>
            {(data.type_name || 'buffer_memory') !== 'none' && (
              <Field label="Memory Scope" hint="Unified: shares conversation history. Isolated: only remembers this agent's actions/tools.">
                <Select
                  value={data.scope || 'unified'}
                  onChange={(v) => update({ scope: v })}
                  options={[
                    { value: 'unified', label: 'Unified (Shared history)' },
                    { value: 'isolated', label: 'Isolated (Private history)' },
                  ]}
                />
              </Field>
            )}
            {((data.type_name || 'buffer_memory') !== 'vector_memory' && (data.type_name || 'buffer_memory') !== 'none') && (
              <Field label="Window Size" hint="Number of recent messages to retain in context.">
                <Input type="number" value={data.window_size ?? 10} onChange={(v) => update({ window_size: parseInt(v) || 10 })} placeholder="10" />
              </Field>
            )}
          </div>
        )}

        {/* ── Tool Node ── */}
        {data.type === 'tool_node' && (
          <>
            <Field label="Managed Tools" hint="Auto-syncs with connected Agents.">
              <ToolTagInput
                value={data.tools || []}
                configs={data.tool_configs || {}}
                onUpdate={syncTools}
                availableTools={availableTools}
              />
            </Field>

            <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
              <div
                onClick={() => {
                  const el = document.getElementById('advanced-options-tool');
                  const arrow = document.getElementById('advanced-arrow-tool');
                  if (el.style.display === 'none') {
                    el.style.display = 'block';
                    arrow.style.transform = 'rotate(180deg)';
                  } else {
                    el.style.display = 'none';
                    arrow.style.transform = 'rotate(0deg)';
                  }
                }}
                style={{
                  padding: '12px 16px', background: '#F8FAFC', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderBottom: '1px solid var(--border)'
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiSettings size={14} color="var(--accent-btn)" /> Advanced Options
                </div>
                <FiChevronDown id="advanced-arrow-tool" size={14} style={{ color: 'var(--text-muted)', transition: 'transform 0.2s' }} />
              </div>

              <div id="advanced-options-tool" style={{ display: 'none', padding: '16px', background: 'white' }}>
                <Toggle checked={data.return_direct} onChange={(v) => syncToggle('return_direct', v)} label="Return tool result directly to user" />
                <div style={{ height: '1px', background: 'var(--border)', margin: '16px 0' }} />
                <Field label="Error Target (On Failure)" hint="If this tool execution fails, jump to this error handler.">
                  <SearchableSelect
                    value={data.on_error || ''}
                    onChange={(v) => update({ on_error: v })}
                    placeholder="— Use Global Handler —"
                    options={[
                      { value: '', label: '— Use Global Handler —' },
                      ...nodes
                        .filter(n => n.id !== selectedNodeId && !['start', 'end'].includes(n.data?.type))
                        .map(n => ({
                          value: n.id,
                          label: n.data?.label || n.id,
                          sublabel: n.data?.type
                        }))
                    ]}
                  />
                </Field>
              </div>
            </div>
          </>
        )}

        {/* ── Direct Tool Node ── */}
        {data.type === 'direct_tool' && (
          <>
            <Field label="Direct Tool Name" hint="Choose the registered tool to execute directly.">
              <SearchableSelect
                value={data.direct_tool_name || ''}
                onChange={(v) => update({ direct_tool_name: v })}
                placeholder="Select a tool…"
                options={availableTools.map(t => ({
                  value: t.name,
                  label: t.display_name || t.name,
                  sublabel: t.category
                }))}
              />
            </Field>

            {data.direct_tool_name && (() => {
              const selectedTool = availableTools.find(t => t.name === data.direct_tool_name);
              if (!selectedTool) return null;

              const schemaProperties = selectedTool.args || selectedTool.args_schema || {};
              const properties = schemaProperties.properties || schemaProperties;
              const requiredFields = Array.isArray(schemaProperties.required) ? schemaProperties.required : [];
              const hasArgs = Object.keys(properties).length > 0;

              return (
                <div style={{
                  marginBottom: 18,
                  padding: '14px 16px',
                  background: '#F8FAFC',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FiBox size={13} style={{ color: 'var(--accent-btn)' }} /> Tool Schema Details
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 12 }}>
                    {selectedTool.description || 'No description provided.'}
                  </div>

                  {hasArgs ? (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                        Expected Arguments
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {Object.entries(properties).map(([argName, argMeta]) => {
                          const isRequired = requiredFields.includes(argName) || argMeta.required;
                          const isAdded = data.tool_arguments && data.tool_arguments.hasOwnProperty(argName);
                          return (
                            <div key={argName} style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 10px', background: 'var(--bg-panel, white)', borderRadius: 8, border: '1px solid var(--border, #E2E8F0)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: 'var(--text-primary, #0F172A)' }}>{argName}</span>
                                <span style={{ fontSize: 9, color: 'var(--text-card-purple, #6366F1)', background: 'var(--bg-card-purple, #EEF2FF)', padding: '1px 5px', borderRadius: 4, fontWeight: 600 }}>
                                  {argMeta.type || 'any'}
                                </span>
                                {isRequired && (
                                  <span style={{ fontSize: 9, color: 'var(--text-card-danger, #EF4444)', fontWeight: 600 }}>required</span>
                                )}
                              </div>
                              {argMeta.description && (
                                <div style={{ fontSize: 10, color: '#64748B', lineHeight: 1.4, marginTop: 2 }}>
                                  {argMeta.description}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: '#64748B', fontStyle: 'italic' }}>
                      This tool does not accept any arguments.
                    </div>
                  )}
                </div>
              );
            })()}

            <Field label="Destination Key" hint="The context key where the tool result will be saved (default: 'tool_result_{node_id}').">
              <Input
                value={data.destination_key || ''}
                onChange={(v) => update({ destination_key: v })}
                placeholder={`tool_result_${selectedNodeId}`}
              />
            </Field>

            <KeyValueEditor
              label="Tool Arguments"
              value={data.tool_arguments || {}}
              onChange={(v) => update({ tool_arguments: v })}
              hint="Arguments to pass to the tool. Supports {{variable}} dynamic replacement."
            />

            <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
              <div
                onClick={() => {
                  const el = document.getElementById('advanced-options-direct-tool');
                  const arrow = document.getElementById('advanced-arrow-direct-tool');
                  if (el.style.display === 'none') {
                    el.style.display = 'block';
                    arrow.style.transform = 'rotate(180deg)';
                  } else {
                    el.style.display = 'none';
                    arrow.style.transform = 'rotate(0deg)';
                  }
                }}
                style={{
                  padding: '12px 16px', background: '#F8FAFC', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderBottom: '1px solid var(--border)'
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiSettings size={14} color="var(--accent-btn)" /> Advanced Options
                </div>
                <FiChevronDown id="advanced-arrow-direct-tool" size={14} style={{ color: 'var(--text-muted)', transition: 'transform 0.2s' }} />
              </div>

              <div id="advanced-options-direct-tool" style={{ display: 'none', padding: '16px', background: 'white' }}>
                <Toggle checked={data.interrupt_before || false} onChange={(v) => update({ interrupt_before: v })} label="Pause before execution (HITL)" />
                <div style={{ height: '1px', background: 'var(--border)', margin: '16px 0' }} />
                <Toggle checked={data.interrupt_after || false} onChange={(v) => update({ interrupt_after: v })} label="Pause after execution (HITL)" />
                <div style={{ height: '1px', background: 'var(--border)', margin: '16px 0' }} />
                <Toggle checked={data.return_direct || false} onChange={(v) => update({ return_direct: v })} label="Return result direct to user" />
                <div style={{ height: '1px', background: 'var(--border)', margin: '16px 0' }} />
                <Field label="Error Target (On Failure)" hint="If this tool execution fails, jump to this error handler.">
                  <SearchableSelect
                    value={data.on_error || ''}
                    onChange={(v) => update({ on_error: v })}
                    placeholder="— Use Global Handler —"
                    options={[
                      { value: '', label: '— Use Global Handler —' },
                      ...nodes
                        .filter(n => n.id !== selectedNodeId && !['start', 'end'].includes(n.data?.type))
                        .map(n => ({
                          value: n.id,
                          label: n.data?.label || n.id,
                          sublabel: n.data?.type
                        }))
                    ]}
                  />
                </Field>
              </div>
            </div>
          </>
        )}



        {/* ── Subgraph ── */}
        {data.type === 'subgraph' && (
          <>
            <Field label="Target Workflow" hint="Select the compiled workflow to invoke as a sub-agent.">
              <SearchableSelect
                value={data.workflow_id || ''}
                onChange={(v) => update({ workflow_id: v })}
                placeholder="Choose a workflow..."
                options={[
                  { value: '', label: '— No workflow selected —' },
                  ...workflows
                    .filter(w => w.id !== currentWorkflowId) // Preventive Healing: Exclude self to avoid infinite recursion
                    .map(w => ({
                      value: w.id,
                      label: w.name,
                      sublabel: `${w.category || 'General'} • ${w.id.slice(0, 8)}`
                    }))
                ]}
              />
            </Field>
            <div style={{ padding: 12, background: 'var(--bg-primary)', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 18 }}>
              <Toggle
                checked={data.return_direct}
                onChange={(v) => update({ return_direct: v })}
                label="Return response directly to user"
              />
            </div>
            {!data.workflow_id && (
              <div style={{ padding: 12, background: '#FFFBEB', borderRadius: 10, fontSize: 12, color: '#92400E', border: '1px solid #FDE68A' }}>
                Select a compiled workflow to use as a subgraph.
              </div>
            )}
          </>
        )}

        {/* ── Router ── */}
        {data.type === 'router' && (
          <>
            <Field label="Routing Key" hint="The state key whose value determines which node to route to.">
              <Input value={data.routing_key || 'next'} onChange={(v) => update({ routing_key: v })} placeholder="next" />
            </Field>
            <div style={{ padding: 12, background: '#F5F3FF', borderRadius: 10, fontSize: 12, color: '#6D28D9', border: '1px solid #DDD6FE', lineHeight: 1.5 }}>
              <FiInfo size={12} style={{ marginRight: 5 }} />
              Connect edges from this router to each possible destination. The routing key value must match the edge condition values.
            </div>
          </>
        )}

        {/* ── Supervisor ── */}
        {data.type === 'supervisor' && (
          <>
            <Field
              label="System Instructions"
              hint="Define the supervisor's orchestration behavior and team goal."
              action={
                <WizardButton
                  onClick={() => handleFixGrammar('task')}
                  loading={fixingGrammar}
                  disabled={!data.task}
                />
              }
            >
              <Textarea value={data.task} onChange={(v) => update({ task: v })} placeholder="You are a manager who..." rows={5} />
            </Field>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Supervisor LLM</div>
              <LLMConfigSection
                llm={data.llm || { provider: 'groq', model: 'llama-3.3-70b-versatile', temperature: 0 }}
                onChange={(llm) => update({ llm })}
              />
            </div>

            <Field label="Member Agents" hint="Select the agent nodes that this supervisor orchestrates.">
              <NodeIdList
                value={data.member_ids || []}
                onChange={(member_ids) => update({ member_ids })}
                allNodes={nodes}
              />
            </Field>

            <Field label="Supervisor Tools" hint="Tools given to the supervisor (Synced with Tool Nodes).">
              <ToolTagInput
                value={data.tools || []}
                configs={data.tool_configs || {}}
                onUpdate={syncTools}
                availableTools={availableTools}
              />
            </Field>

            <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
              <div
                onClick={() => {
                  const el = document.getElementById('advanced-options-supervisor');
                  const arrow = document.getElementById('advanced-arrow-supervisor');
                  if (el.style.display === 'none') {
                    el.style.display = 'block';
                    arrow.style.transform = 'rotate(180deg)';
                  } else {
                    el.style.display = 'none';
                    arrow.style.transform = 'rotate(0deg)';
                  }
                }}
                style={{
                  padding: '12px 16px', background: '#F8FAFC', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderBottom: '1px solid var(--border)'
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiSettings size={14} color="var(--accent-btn)" /> Advanced Options
                </div>
                <FiChevronDown id="advanced-arrow-supervisor" size={14} style={{ color: 'var(--text-muted)', transition: 'transform 0.2s' }} />
              </div>

              <div id="advanced-options-supervisor" style={{ display: 'none', padding: '16px', background: 'white' }}>
                {/* Iteration policy for supervisor */}
                <div style={{ marginBottom: 20 }}>
                  <IterationConfigSection
                    policy={data.iteration_policy}
                    onChange={(policy) => update({ iteration_policy: policy })}
                  />
                </div>

                <div style={{ height: '1px', background: 'var(--border)', margin: '16px 0' }} />

                <Field label="Error Target (On Failure)" hint="If supervision fails, jump to this error handler.">
                  <SearchableSelect
                    value={data.on_error || ''}
                    onChange={(v) => update({ on_error: v })}
                    placeholder="— Use Global Handler —"
                    options={[
                      { value: '', label: '— Use Global Handler —' },
                      ...nodes
                        .filter(n => n.id !== selectedNodeId && !['start', 'end'].includes(n.data?.type))
                        .map(n => ({
                          value: n.id,
                          label: n.data?.label || n.id,
                          sublabel: n.data?.type
                        }))
                    ]}
                  />
                </Field>
              </div>
            </div>
          </>
        )}

        {/* ── Swarm ── */}
        {data.type === 'swarm' && (
          <>
            <Field
              label="System Instructions"
              hint="General persona and rules shared across the swarm behavior."
              action={
                <WizardButton
                  onClick={() => handleFixGrammar('task')}
                  loading={fixingGrammar}
                  disabled={!data.task}
                />
              }
            >
              <Textarea value={data.task} onChange={(v) => update({ task: v })} placeholder="You are a team of..." rows={5} />
            </Field>

            <Field label="Swarm Agents" hint="Agents that can hand off to each other. Order determines initial priority.">
              <NodeIdList
                value={data.member_ids || []}
                onChange={(member_ids) => update({ member_ids })}
                allNodes={nodes}
              />
            </Field>
            <Field label="Swarm Tools" hint="Tools available to all swarm members. (Synced with Tool Nodes)">
              <ToolTagInput
                value={data.tools || []}
                configs={data.tool_configs || {}}
                onUpdate={syncTools}
                availableTools={availableTools}
              />
            </Field>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Swarm LLM</div>
              <LLMConfigSection
                llm={data.llm || { provider: 'groq', model: 'llama-3.3-70b-versatile', temperature: 0 }}
                onChange={(llm) => update({ llm })}
              />
            </div>

            <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
              <div
                onClick={() => {
                  const el = document.getElementById('advanced-options-swarm');
                  const arrow = document.getElementById('advanced-arrow-swarm');
                  if (el.style.display === 'none') {
                    el.style.display = 'block';
                    arrow.style.transform = 'rotate(180deg)';
                  } else {
                    el.style.display = 'none';
                    arrow.style.transform = 'rotate(0deg)';
                  }
                }}
                style={{
                  padding: '12px 16px', background: '#F8FAFC', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderBottom: '1px solid var(--border)'
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiSettings size={14} color="var(--accent-btn)" /> Advanced Options
                </div>
                <FiChevronDown id="advanced-arrow-swarm" size={14} style={{ color: 'var(--text-muted)', transition: 'transform 0.2s' }} />
              </div>

              <div id="advanced-options-swarm" style={{ display: 'none', padding: '16px', background: 'white' }}>
                {/* Iteration policy for swarm */}
                <div style={{ marginBottom: 20 }}>
                  <IterationConfigSection
                    policy={data.iteration_policy}
                    onChange={(policy) => update({ iteration_policy: policy })}
                  />
                </div>

                <div style={{ height: '1px', background: 'var(--border)', margin: '16px 0' }} />

                <Field label="Error Target (On Failure)" hint="If the swarm orchestration fails, jump to this error handler.">
                  <SearchableSelect
                    value={data.on_error || ''}
                    onChange={(v) => update({ on_error: v })}
                    placeholder="— Use Global Handler —"
                    options={[
                      { value: '', label: '— Use Global Handler —' },
                      ...nodes
                        .filter(n => n.id !== selectedNodeId && !['start', 'end'].includes(n.data?.type))
                        .map(n => ({
                          value: n.id,
                          label: n.data?.label || n.id,
                          sublabel: n.data?.type
                        }))
                    ]}
                  />
                </Field>
              </div>
            </div>
          </>
        )}


        {/* ── Notification Node ── */}
        {data.type === 'notification' && (
          <>
            <VariablePicker onSelect={(v) => update({ notification_message: (data.notification_message || '') + v })} />

            <Field label="Notification Title" hint="Supports {{variable}} interpolation.">
              <Input
                value={data.notification_title || ''}
                onChange={(v) => update({ notification_title: v })}
                placeholder="e.g. Workflow {{name}} Finished"
              />
            </Field>
            <Field label="Message Content" hint="The main body of the notification. Supports {{variable}} interpolation.">
              <Textarea
                value={data.notification_message || ''}
                onChange={(v) => update({ notification_message: v })}
                placeholder="Details of the event..."
                rows={5}
              />
            </Field>
            <Field label="Alert Type">
              <Select
                value={data.notification_type || 'info'}
                onChange={(v) => update({ notification_type: v })}
                options={[
                  { value: 'info', label: 'Info (Blue)' },
                  { value: 'success', label: 'Success (Green)' },
                  { value: 'warning', label: 'Warning (Yellow)' },
                  { value: 'error', label: 'Error (Red)' }
                ]}
              />
            </Field>
            <Toggle
              label="Mute Chat Message"
              checked={data.mute_notification_message || false}
              onChange={(v) => update({ mute_notification_message: v })}
            />
            <Toggle
              label="Enable 'Open Chat' Button"
              checked={data.show_chat_button || false}
              onChange={(v) => update({ show_chat_button: v })}
            />
            <div style={{ marginTop: 20, padding: 12, background: '#F0F9FF', borderRadius: 10, fontSize: 11, color: '#0369A1', lineHeight: 1.5, border: '1px solid #BAE6FD' }}>
              <FiInfo size={12} style={{ marginRight: 6 }} />
              Triggering this node stores a persistent notification that can be viewed in the notifications center.
            </div>
          </>
        )}

        {/* ── Splitter Node ── */}
        {data.type === 'splitter' && (
          <>
            <Field label="Field to Split" hint="The key in state/context that contains the array (e.g., 'items').">
              <Input value={data.split_field || 'items'} onChange={(v) => update({ split_field: v })} placeholder="e.g. items" />
            </Field>
            <Field label="Batch Size" hint="Number of items to process per iteration.">
              <Input type="number" value={data.batch_size ?? 1} onChange={(v) => update({ batch_size: parseInt(v) || 1 })} placeholder="1" />
            </Field>
            <Field label="Destination Field" hint="The context key where the current item will be stored (default: 'item').">
              <Input value={data.destination_field || 'item'} onChange={(v) => update({ destination_field: v })} placeholder="item" />
            </Field>

            <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>Global Discovery Options</div>
              <Field label="Discovery Keys (Optional)" hint="Comma-separated prefix patterns (e.g. 'cd_output_') to gather extra keys from state and inject them into each split iteration's context.">
                <Input value={data.discovery_keys || ''} onChange={(v) => update({ discovery_keys: v })} placeholder="cd_output_, ocr_like_results" />
              </Field>
            </div>

            <div style={{ padding: 12, background: 'var(--bg-card-warning-alt, #FFF7ED)', borderRadius: 10, fontSize: 11, color: 'var(--text-card-warning-alt, #9A3412)', border: '1px solid var(--border-card-warning-alt, #FED7AA)', lineHeight: 1.5 }}>
              <FiInfo size={12} style={{ marginRight: 6 }} />
              Iterates through a list. Each iteration puts the current item into <strong>context.{data.destination_field || 'item'}</strong>.
              <br /><br />
              Use <strong>intent == 'loop'</strong> for the processing path and <strong>intent == 'done'</strong> for the completion path.
            </div>
          </>
        )}

        {/* ── Aggregator Node ── */}
        {data.type === 'aggregator' && (
          <>
            <Field label="Action Strategy" hint="How to group the incoming items.">
              <Select
                value={data.action || 'append'}
                onChange={(v) => update({ action: v })}
                options={[
                  { value: 'append', label: 'Append to List (Array)' },
                  { value: 'merge', label: 'Merge into Object (Dict)' },
                  { value: 'concatenate', label: 'Concatenate (String)' }
                ]}
              />
            </Field>
            <Field label="Field to Aggregate" hint="The path to the data you want to collect (e.g. 'item').">
              <Input value={data.field_to_aggregate || 'item'} onChange={(v) => update({ field_to_aggregate: v })} placeholder="item" />
            </Field>
            <Field label="Destination Field" hint="Where to store the final combined result.">
              <Input value={data.destination_field || 'aggregated_results'} onChange={(v) => update({ destination_field: v })} placeholder="aggregated_results" />
            </Field>
            {data.action === 'concatenate' && (
              <Field label="Separator" hint="Characters used to join strings (e.g. \n).">
                <Input value={data.separator || '\\n'} onChange={(v) => update({ separator: v })} placeholder="\\n" />
              </Field>
            )}
            <div style={{ padding: 12, background: '#F0F9FF', borderRadius: 10, fontSize: 11, color: '#0369A1', border: '1px solid #BAE6FD', lineHeight: 1.5 }}>
              <FiLayers size={12} style={{ marginRight: 6 }} />
              Collects data across loop iterations. It will release the full payload to <strong>context.{data.destination_field || 'aggregated_results'}</strong> automatically once the Splitter finishes.
            </div>
          </>
        )}


        {/* ── Payload Builder ── */}
        {data.type === 'payload_builder' && (
          <>
            <Field label="Payload Template (JSON or String)" hint="Define the template. Supports {{context.var}} interpolation.">
              <Textarea
                value={typeof data.payload_template === 'object' && data.payload_template !== null ? JSON.stringify(data.payload_template, null, 2) : data.payload_template || ''}
                onChange={(v) => {
                  try {
                    const parsed = JSON.parse(v);
                    update({ payload_template: parsed });
                  } catch (e) {
                    update({ payload_template: v });
                  }
                }}
                placeholder='{\n  "customer_name": "{{context.customer_name}}"\n}'
                rows={10}
              />
            </Field>
            <Field label="Destination Key" hint="The context key where the built payload will be stored.">
              <Input
                value={data.payload_destination_key || 'webhook_payload'}
                onChange={(v) => update({ payload_destination_key: v })}
                placeholder="webhook_payload"
              />
            </Field>

            <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>Auto-Collection Options</div>
              <Field label="Auto Collect Prefix" hint="Automatically merge all context keys matching this prefix into the payload (e.g., 'cd_output_').">
                <Input value={data.auto_collect_prefix || ''} onChange={(v) => update({ auto_collect_prefix: v })} placeholder="cd_output_" />
              </Field>
              <Field label="Clean Binary Fields" hint="Comma-separated paths to remove from auto-collected items before final payload generation (e.g. 'binary_image, raw_pdf').">
                <Input value={data.clean_binary_from || ''} onChange={(v) => update({ clean_binary_from: v })} placeholder="binary_data, image_bytes" />
              </Field>
            </div>
          </>
        )}


        {/* ── API Node ── */}
        {data.type === 'api_node' && (
          <>
            <div style={{ padding: 16, background: 'var(--bg-card-info, #F0F9FF)', borderRadius: 12, border: '1px solid var(--border-card-info, #BAE6FD)', marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-card-info, #0369A1)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Enterprise Connector</div>

              <Field label="Connection Profile" hint="Select a saved connection from the vault to handle Auth automatically.">
                <ConnectionsDropdown
                  value={data.connection_id}
                  onChange={(v) => update({ connection_id: v })}
                />
              </Field>

              <Field label="API Protocol">
                <Select
                  value={data.api_protocol || 'REST'}
                  onChange={(v) => update({ api_protocol: v })}
                  options={[
                    { value: 'REST', label: 'REST (Standard JSON)' },
                    { value: 'SOAP', label: 'SOAP (Strict XML)' },
                    { value: 'GRAPHQL', label: 'GraphQL (Query)' }
                  ]}
                />
              </Field>
            </div>


            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: '120px' }}>
                <Field label="Method">
                  <Select
                    value={data.api_method || 'GET'}
                    onChange={(v) => update({ api_method: v })}
                    options={['GET', 'POST', 'PUT', 'DELETE', 'PATCH']}
                  />
                </Field>
              </div>
              <div style={{ flex: 1 }}>
                <Field label="Endpoint URL" hint="Supports {{key}} or {{msg}}">
                  <Input
                    value={data.api_url || ''}
                    onChange={(v) => update({ api_url: v })}
                    placeholder="https://api.example.com/..."
                    style={(!data.api_url || data.api_url.trim().startsWith('http://') || data.api_url.trim().startsWith('https://') || data.api_url.trim().startsWith('{{')) ? {} : { border: '1px solid var(--border-card-danger, #EF4444)', background: 'var(--bg-card-danger, #FEF2F2)' }}
                  />
                  {data.api_url && !(data.api_url.trim().startsWith('http://') || data.api_url.trim().startsWith('https://') || data.api_url.trim().startsWith('{{')) && (
                    <div style={{ color: '#EF4444', fontSize: 11, marginTop: 4, fontWeight: 500 }}>
                      URL must start with http://, https://, or a variable {'{{...}}'}.
                    </div>
                  )}
                </Field>
              </div>
            </div>


            {!data.connection_id && (
              <div style={{ padding: 16, background: '#F8F9FA', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Manual Authentication</div>
                <Field label="Auth Type">
                  <Select
                    value={data.api_auth_type || 'None'}
                    onChange={(v) => update({ api_auth_type: v })}
                    options={['None', 'Basic', 'Bearer']}
                  />
                </Field>

                {data.api_auth_type === 'Basic' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Field label="Username">
                      <Input value={data.api_auth_config?.username} onChange={(v) => update({ api_auth_config: { ...data.api_auth_config, username: v } })} placeholder="user" />
                    </Field>
                    <Field label="Password">
                      <Input value={data.api_auth_config?.password} onChange={(v) => update({ api_auth_config: { ...data.api_auth_config, password: v } })} placeholder="pass" type="password" />
                    </Field>
                  </div>
                )}

                {data.api_auth_type === 'Bearer' && (
                  <Field label="Token">
                    <Input value={data.api_auth_config?.token} onChange={(v) => update({ api_auth_config: { ...data.api_auth_config, token: v } })} placeholder="Bearer token…" type="password" />
                  </Field>
                )}
              </div>
            )}

            <KeyValueEditor
              label="Headers"
              value={data.api_headers || {}}
              onChange={(v) => update({ api_headers: v })}
              hint="e.g. Content-Type: application/json"
            />

            <KeyValueEditor
              label="Query Params"
              value={data.api_params || {}}
              onChange={(v) => update({ api_params: v })}
              hint="Appended to the URL"
            />

            {['POST', 'PUT', 'PATCH'].includes(data.api_method) && (
              <Field label="Request Body" hint="JSON or raw text. Supports {{interpolation}}.">
                <Textarea
                  value={data.api_body || ''}
                  onChange={(v) => update({ api_body: v })}
                  placeholder='{"id": "{{item.id}}"}'
                  rows={5}
                />
              </Field>
            )}

            <Field label="Response Format">
              <Select
                value={data.api_response_format || 'json'}
                onChange={(v) => update({ api_response_format: v })}
                options={[
                  { value: 'json', label: 'JSON (Parsed Object)' },
                  { value: 'text', label: 'Raw String' },
                  { value: 'binary', label: 'Binary Info' }
                ]}
              />
            </Field>


            <div style={{ height: '1px', background: 'var(--border)', margin: '16px 0' }} />
            
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>Human-in-the-Loop</div>
              <Toggle
                checked={data.interrupt_after === true}
                onChange={(v) => update({ interrupt_after: v })}
                label="Pause AFTER API execution (interrupt_after)"
              />
              <div style={{ fontSize: 10, color: '#059669', marginTop: 2, marginLeft: 28 }}>
                Halts the workflow after sending the payload. The workflow will wait until an external system resumes it.
              </div>
            </div>

            <div style={{ marginTop: 20, padding: 12, background: '#F0F9FF', borderRadius: 10, fontSize: 11, color: '#0369A1', lineHeight: 1.5, border: '1px solid #BAE6FD' }}>
              <FiInfo size={12} style={{ marginRight: 6 }} />
              Result is saved to <strong>context.api_result_{selectedNodeId}</strong>. Use it in prompts as <code>{`{{api_result_${selectedNodeId}.some_field}}`}</code>.
            </div>
          </>
        )}

        {/* ── Form Submission Node ── */}
        {data.type === 'form_node' && (
          <>
            <Field label="Form Title" hint="The heading shown at the top of the form.">
              <Input
                value={data.form_title || ''}
                onChange={(v) => update({ form_title: v })}
                placeholder="e.g. Please Provide Information"
              />
            </Field>
            <Field label="Form Description" hint="Introductory text or instructions for the user.">
              <Textarea
                value={data.form_description || ''}
                onChange={(v) => update({ form_description: v })}
                placeholder="e.g. Tell us more about your request so we can assist you better."
                rows={3}
              />
            </Field>

            <FormFieldsEditor
              fields={data.form_fields || []}
              onChange={(f) => update({ form_fields: f })}
            />

            <Field label="Submit Button Label">
              <Input
                value={data.form_submit_label || 'Submit'}
                onChange={(v) => update({ form_submit_label: v })}
                placeholder="Submit"
              />
            </Field>

            <Toggle
              label="Dynamic Schema (from Context)"
              checked={data.form_use_context_schema || false}
              onChange={(v) => update({ form_use_context_schema: v })}
            />
            {data.form_use_context_schema && (
              <div style={{ padding: 10, background: '#F0F9FF', borderRadius: 10, fontSize: 11, color: '#0369A1', border: '1px solid #BAE6FD', marginTop: -10, marginBottom: 20 }}>
                If enabled, the form will be generated from <code>context.form_schema</code> (must be a JSON array of fields) instead of the static fields above.
              </div>
            )}

            <div style={{ marginTop: 20, padding: 12, background: '#F8F9FA', borderRadius: 10, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, border: '1px solid var(--border)' }}>
              <FiInfo size={12} style={{ marginRight: 6 }} />
              Workflow will pause and wait for the user to submit this form. Results are merged into the workflow context.
            </div>
          </>
        )}

        {/* ── File Store Node ── */}
        {data.type === 'file_store' && (
          <>
            <Field label="File Format" hint="Choose the output format. Excel is best for visual reading, CSV for data processing.">
              <Select
                value={data.file_format || 'csv'}
                onChange={(v) => update({ file_format: v })}
                options={[
                  { value: 'csv', label: 'CSV (Comma Separated)' },
                  { value: 'excel', label: 'Excel (.xlsx)' },
                  { value: 'txt', label: 'Plain Text (.txt)' }
                ]}
              />
            </Field>

            <Field label="Filename" hint="The name of the saved file. Supports {{variable}} interpolation.">
              <Input
                value={data.file_name || ''}
                onChange={(v) => update({ file_name: v })}
                placeholder="e.g. leads_{{search_query}}"
              />
            </Field>

            <Field label="Data Source Key" hint="Optional: Specify a key in the context to save. If empty, saves the latest API result or last message.">
              <Input
                value={data.file_data_key || ''}
                onChange={(v) => update({ file_data_key: v })}
                placeholder="e.g. scraped_items"
              />
            </Field>

            <div style={{ padding: 16, background: '#F8F9FA', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 20 }}>
              <Toggle
                checked={data.file_overwrite !== false}
                onChange={(v) => update({ file_overwrite: v })}
                label="Overwrite Existing File"
              />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: -8, marginLeft: 50 }}>
                If disabled, CSV will append new data to the existing file. Excel always overwrites.
              </div>
            </div>

            <div style={{ padding: 12, background: '#ECFDF5', borderRadius: 10, fontSize: 11, color: '#059669', lineHeight: 1.5, border: '1px solid #A7F3D0' }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Storage Location:</div>
              Files are saved in <strong>Backend/mnt/exports/</strong> and the full path is saved to <strong>latest_file_path</strong>.
            </div>
          </>
        )}

        {/* ── Debug Console Node ── */}
        {data.type === 'debug_node' && (
          <>
            <Field label="Snapshot Scope" hint="Choose what to print to the console.">
              <Select
                value={data.debug_scope || 'context'}
                onChange={(v) => update({ debug_scope: v })}
                options={[
                  { value: 'context', label: 'Workflow Context (Variables)' },
                  { value: 'messages', label: 'Last 5 Messages (History)' },
                  { value: 'full_state', label: 'Full Engine State' },
                  { value: 'evaluation', label: 'Evaluation Scope (Raw View)' },
                  { value: 'selective', label: 'Selective Key' }
                ]}
              />
            </Field>

            {data.debug_scope === 'selective' && (
              <Field label="Target Key" hint="The specific context key you want to inspect.">
                <Input
                  value={data.debug_key || ''}
                  onChange={(v) => update({ debug_key: v })}
                  placeholder="e.g. results"
                />
              </Field>
            )}

            <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 10, fontSize: 11, color: '#475569', lineHeight: 1.5, border: '1px solid var(--border)' }}>
              <FiInfo size={12} style={{ marginRight: 6 }} />
              Prints a formatted JSON snapshot of the workflow state directly to the chat interface. Use this to verify data movement between nodes.
            </div>
          </>
        )}

        {/* ── Error Router ── */}
        {data.type === 'error_router' && (
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
        )}

        {/* ── Data Cleaning Node ── */}
        {data.type === 'data_cleaning' && (
          <>
            <Field label="Cleaning Rules" hint="Select the data cleaning rules to apply to the dataset.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#F8FAFC', padding: 12, borderRadius: 10, border: '1px solid var(--border)' }}>
                {[
                  { value: 'GEN_TRIM_WHITESPACE', label: 'Trim Whitespace', desc: 'Remove leading and trailing whitespaces' },
                  { value: 'GEN_PROPER_CASE', label: 'Proper Case', desc: 'Capitalize first letter of each word (Title Case)' },
                  { value: 'GEN_STRIP_SPECIAL_CHARS', label: 'Strip Special Characters', desc: 'Remove all non-alphanumeric characters except spaces' },
                  { value: 'GEN_STRIP_CURRENCY', label: 'Strip Currency Symbols', desc: 'Remove currency signs ($, ₹, €, etc.) and parse as numbers' },
                  { value: 'GEN_NORMALIZE_CATEGORY', label: 'Normalize Category', desc: 'Lowercase, clean, and convert to snake_case' }
                ].map((rule) => {
                  const rules = data.data_cleaning_rules || [];
                  const isChecked = rules.includes(rule.value);
                  const handleRuleToggle = (checked) => {
                    const nextRules = checked
                      ? [...rules, rule.value]
                      : rules.filter(r => r !== rule.value);
                    update({ data_cleaning_rules: nextRules });
                  };

                  return (
                    <div key={rule.value} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => handleRuleToggle(e.target.checked)}
                        style={{ marginTop: 3, cursor: 'pointer' }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{rule.label}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{rule.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Field>

            <Field label="Data Source Target" hint="Where is the data coming from?">
              <Select
                value={data.data_cleaning_target || 'latest_message'}
                onChange={(v) => update({ data_cleaning_target: v })}
                options={[
                  { value: 'latest_message', label: 'Latest Chat Message' },
                  { value: 'context_data', label: 'Workflow Context Key' }
                ]}
              />
            </Field>

            {data.data_cleaning_target === 'context_data' && (
              <Field label="Source Context Key" hint="Specify the context key where the input JSON string/dictionary is stored.">
                <Input
                  value={data.data_cleaning_input_key || ''}
                  onChange={(v) => update({ data_cleaning_input_key: v })}
                  placeholder="e.g. raw_input_json"
                />
              </Field>
            )}

            <Field label="Output Context Key" hint="The context key where the cleaned dataset (dict or list) and execution metrics will be saved.">
              <Input
                value={data.data_cleaning_output_key || 'cleaned_data'}
                onChange={(v) => update({ data_cleaning_output_key: v })}
                placeholder="cleaned_data"
              />
            </Field>

            <div style={{ marginTop: 20, padding: 12, background: '#ECFDF5', borderRadius: 10, fontSize: 11, color: '#059669', lineHeight: 1.5, border: '1px solid #A7F3D0' }}>
              <FiInfo size={12} style={{ marginRight: 6 }} />
              Loads a JSON string/dictionary, runs a Pandas data cleaning script, and outputs the cleaned dataset plus execution metrics (issues found, fixes applied).
            </div>
          </>
        )}

        {/* ── Network Graph Node ── */}
        {data.type === 'network_graph' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiDatabase color="#10B981" size={14} /> Neo4j Connection Settings
              </div>
              <Field label="Target Context Key" hint="Context key containing transaction details to ingest.">
                <Input value={data.graph_target_key ?? 'latest_message'} onChange={(v) => update({ graph_target_key: v })} placeholder="latest_message" />
              </Field>
              <Field label="Neo4j Connection URI" hint="Override default bolt connection string. E.g. bolt://localhost:7687">
                <Input value={data.graph_neo4j_uri ?? ''} onChange={(v) => update({ graph_neo4j_uri: v })} placeholder="bolt://localhost:7687" />
              </Field>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <Field label="Username">
                    <Input value={data.graph_neo4j_user ?? ''} onChange={(v) => update({ graph_neo4j_user: v })} placeholder="neo4j" />
                  </Field>
                </div>
                <div style={{ flex: 1 }}>
                  <Field label="Password">
                    <Input type="password" value={data.graph_neo4j_password ?? ''} onChange={(v) => update({ graph_neo4j_password: v })} placeholder="••••••••" />
                  </Field>
                </div>
              </div>
              <Field label="Graph Label / Collection" hint="Dynamic label/collection tag applied to accounts/transactions (e.g. FraudFlow, RetailFlow).">
                <Input value={data.graph_collection ?? 'FraudFlow'} onChange={(v) => update({ graph_collection: v })} placeholder="FraudFlow" />
              </Field>
            </div>

            <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, background: '#F8FAFC', marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dynamic Data Binding (JSON Mapping)</div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.4 }}>
                Map fields from your input transaction JSON to the network graph keys. Leave empty to fallback to standard transactional fraud schema keys.
              </p>
              <Field label="Sender Account Key" hint="Path in transaction JSON for sender ID (e.g. account_id or sender.id)">
                <Input value={data.graph_sender_key ?? ''} onChange={(v) => update({ graph_sender_key: v })} placeholder="account_id" />
              </Field>
              <Field label="Beneficiary Account Key" hint="Path in transaction JSON for receiver ID (e.g. beneficiary_id or receiver.id)">
                <Input value={data.graph_receiver_key ?? ''} onChange={(v) => update({ graph_receiver_key: v })} placeholder="beneficiary_id" />
              </Field>
              <Field label="Transaction ID Key" hint="Path in transaction JSON for unique TX identifier (e.g. transaction_id)">
                <Input value={data.graph_txn_id_key ?? ''} onChange={(v) => update({ graph_txn_id_key: v })} placeholder="transaction_id" />
              </Field>
              <Field label="Transaction Amount Key" hint="Path in transaction JSON for amount field (e.g. transaction_amount)">
                <Input value={data.graph_amount_key ?? ''} onChange={(v) => update({ graph_amount_key: v })} placeholder="transaction_amount" />
              </Field>
              <Field label="Transaction Timestamp Key" hint="Path in transaction JSON for timestamp field (e.g. timestamp)">
                <Input value={data.graph_timestamp_key ?? ''} onChange={(v) => update({ graph_timestamp_key: v })} placeholder="timestamp" />
              </Field>
            </div>
          </>
        )}

        {/* ── PII Masking Node (Enterprise) ── */}
        {data.type === 'pii_node' && (
          <>
            {/* ─── Engine Selection (HOW to mask) ─── */}
            <Field label="Masking Engine" hint="WHO performs the masking. Local is fast but destructive; DocBot is enterprise-grade with encrypted vault and reversible tokens.">
              <Select
                value={data.pii_engine || 'local'}
                onChange={(v) => update({ pii_engine: v })}
                options={[
                  { value: 'local', label: 'Local (DataFog — Fast, In-Process)' },
                  { value: 'docbot', label: 'External (DocBot — Vaulted, Reversible)' }
                ]}
              />
            </Field>

            {/* Local engine sub-option: DataFog algorithm */}
            {(data.pii_engine || 'local') === 'local' && (
              <>
                <Field label="Detection Algorithm" hint="Regex is fast (pattern-matching). GLiNER uses NLP for context-aware detection.">
                  <Select
                    value={data.datafog_engine || 'regex'}
                    onChange={(v) => update({ datafog_engine: v })}
                    options={[
                      { value: 'regex', label: 'Regex (Fast, Pattern-based)' },
                      { value: 'gliner', label: 'GLiNER (NLP, Context-aware)' }
                    ]}
                  />
                </Field>
                <div style={{
                  padding: '10px 12px', background: '#FEF3C7', borderRadius: 8,
                  fontSize: 10, color: '#92400E', border: '1px solid #FDE68A',
                  lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: 8
                }}>
                  <FiAlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span><strong>Destructive masking:</strong> Original data is permanently replaced with placeholders (e.g., [PERSON]). Not reversible. For reversible masking with a secure vault, use the DocBot engine.</span>
                </div>
              </>
            )}

            {/* DocBot engine settings */}
            {data.pii_engine === 'docbot' && (
              <>
                <Field label="DocBot API URL" hint="Base URL of the DocBot PII service.">
                  <Input
                    value={data.docbot_url || 'http://localhost:8000'}
                    onChange={(v) => update({ docbot_url: v })}
                    placeholder="http://localhost:8000"
                  />
                </Field>
                <Field label="DocBot Method" hint="Local = regex only (fast). Hybrid = regex + LLM verification (more accurate, slower).">
                  <Select
                    value={data.docbot_method || 'local'}
                    onChange={(v) => update({ docbot_method: v })}
                    options={[
                      { value: 'local', label: 'Local (Regex — Fast)' },
                      { value: 'hybrid', label: 'Hybrid (Regex + LLM — Accurate)' }
                    ]}
                  />
                </Field>
                <div style={{
                  padding: '10px 12px', background: '#ECFDF5', borderRadius: 8,
                  fontSize: 10, color: '#065F46', border: '1px solid #A7F3D0',
                  lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: 8
                }}>
                  <FiShield size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span><strong>Enterprise vault:</strong> Original PII is encrypted and stored in DocBot's secure vault. Masked tokens (e.g., [PAN_a3f82b1c]) are reversible via the /pii/reveal endpoint.</span>
                </div>
              </>
            )}

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0', opacity: 0.4 }} />

            {/* ─── Target Selection (WHAT to mask) ─── */}
            <Field label="Redaction Target" hint="WHAT data should be scanned and masked. Works with any engine.">
              <Select
                value={data.pii_target || 'latest_message'}
                onChange={(v) => update({ pii_target: v })}
                options={[
                  { value: 'latest_message', label: 'Latest Message' },
                  { value: 'context_variable', label: 'Context Variable (JSON-safe)' },
                  { value: 'targeted_replacement', label: 'Targeted Replacement (Precision)' }
                ]}
              />
            </Field>

            {/* Context Variable target: key input */}
            {data.pii_target === 'context_variable' && (
              <Field label="Context Key" hint="Specific context variable to mask. Leave empty to mask entire context.">
                <Input
                  value={data.context_variable_key || ''}
                  onChange={(v) => update({ context_variable_key: v })}
                  placeholder="e.g. user_input or leave empty for all"
                />
              </Field>
            )}

            {/* Targeted Replacement: identifier + rendered key inputs */}
            {data.pii_target === 'targeted_replacement' && (
              <>
                <div style={{
                  padding: '10px 12px', background: '#EFF6FF', borderRadius: 8,
                  fontSize: 10, color: '#1E40AF', border: '1px solid #BFDBFE',
                  lineHeight: 1.5, marginBottom: 8
                }}>
                  <strong>Precision mode:</strong> Takes known sensitive values (from an upstream Extract Identifiers node) and does an exact find-and-replace in the rendered text. Zero false positives — only masks what you explicitly extracted.
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <Field label="Identifiers Input Key" hint="Context key containing extracted identifiers array.">
                      <Input
                        value={data.identifiers_input_key || 'extracted_identifiers'}
                        onChange={(v) => update({ identifiers_input_key: v })}
                        placeholder="extracted_identifiers"
                      />
                    </Field>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Field label="Rendered Text Key" hint="Context key containing the text/summaries where values will be masked.">
                      <Input
                        value={data.rendered_input_key || 'ocr_like_results'}
                        onChange={(v) => update({ rendered_input_key: v })}
                        placeholder="ocr_like_results"
                      />
                    </Field>
                  </div>
                </div>
              </>
            )}

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0', opacity: 0.4 }} />

            {/* ─── Custom Regex Patterns (pre-processing layer) ─── */}
            <CustomRegexEditor
              value={data.pii_custom_regex || []}
              onChange={(v) => update({ pii_custom_regex: v })}
            />

            <div style={{
              padding: '12px 14px',
              background: '#F8FAFC',
              borderRadius: 10,
              fontSize: 11,
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              lineHeight: 1.5,
              marginTop: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              justifyContent: 'space-between'
            }}>
              <span style={{ flex: 1, fontWeight: 500 }}>
                Privacy Guard: Custom regex patterns run as a pre-processing step before the main engine. This ensures matching data never reaches the engine at all.
              </span>
            </div>
          </>
        )}


        {/* ── JSON Transform Node ── */}
        {data.type === 'json_transform' && (
          <>
            <Field label="Input Context Key" hint="Context key to read data from (supports dot notation, e.g. latest_api_result.data). Defaults to latest_api_result.">
              <Input
                value={data.jt_input_key ?? 'latest_api_result'}
                onChange={(v) => update({ jt_input_key: v })}
                placeholder="latest_api_result"
              />
            </Field>

            <Field label="Output Context Key" hint="Context key where the transformed data will be saved. Defaults to transformed_data.">
              <Input
                value={data.jt_output_key ?? 'transformed_data'}
                onChange={(v) => update({ jt_output_key: v })}
                placeholder="transformed_data"
              />
            </Field>

            <Field label="Transform Mode" hint="JMESPath (declarative queries), Python Expression (custom sandboxed logic), or Operations (visual rules).">
              <Select
                value={data.jt_mode ?? 'jmespath'}
                onChange={(v) => update({ jt_mode: v })}
                options={[
                  { value: 'jmespath', label: 'JMESPath (JSON Query)' },
                  { value: 'python_expr', label: 'Python Expression (Sandboxed)' },
                  { value: 'operations', label: 'Visual Operations' },
                ]}
              />
            </Field>

            {data.jt_mode === 'jmespath' && (
              <Field label="JMESPath Query" hint="Query string. E.g. tasks[?status=='SUCCESS'].task_id or job_status.tasks[*].task_id">
                <Textarea
                  value={data.jt_query ?? ''}
                  onChange={(v) => update({ jt_query: v })}
                  placeholder="job_status.tasks[*].task_id"
                  rows={4}
                />
              </Field>
            )}

            {data.jt_mode === 'python_expr' && (
              <Field label="Python Expression" hint="A sandboxed python expression. Use 'data' as the input variable. E.g. [t['task_id'] for t in data['tasks']]">
                <Textarea
                  value={data.jt_expression ?? ''}
                  onChange={(v) => update({ jt_expression: v })}
                  placeholder="[t['task_id'] for t in data['tasks']]"
                  rows={4}
                />
              </Field>
            )}

            {data.jt_mode === 'operations' && (
              <VisualOperationsEditor
                value={data.jt_operations || []}
                onChange={(ops) => update({ jt_operations: ops })}
              />
            )}

            <Toggle
              label="Merge / Pass Through Input"
              checked={data.jt_pass_through || false}
              onChange={(v) => update({ jt_pass_through: v })}
            />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: -8, marginBottom: 20 }}>
              If enabled, merges the output dictionary into the input dictionary.
            </div>

            <div style={{ padding: 12, background: 'var(--bg-card-info, #F0F9FF)', borderRadius: 10, fontSize: 11, color: 'var(--text-card-info, #0369A1)', border: '1px solid var(--border-card-info, #BAE6FD)' }}>
              <FiFilter size={12} style={{ marginRight: 6, display: 'inline' }} />
              Transforms JSON data structure without an LLM. Pure, zero-latency deterministic transformation.
            </div>
          </>
        )}


        {/* ── Classification Node ── */}
        {data.type === 'classification' && (
          <>
            {/* 1. Classification Engine Selection */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 6 }}>
                Classification Engine
              </label>
              <Select
                value={data.classification_engine || 'llm'}
                onChange={(v) => update({ classification_engine: v })}
                options={[
                  { value: 'llm', label: 'LLM (AI Classifier)' },
                  { value: 'regex', label: 'Regex Patterns (Static Classifier)' }
                ]}
              />
            </div>

            {/* 2. LLM Model Selection (only if LLM engine is selected) */}
            {data.classification_engine !== 'regex' && (
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FiCpu size={12} /> Model Settings
                </div>
                <LLMConfigSection
                  llm={data.llm || { provider: 'groq', model: 'llama-3.3-70b-versatile', temperature: 0 }}
                  onChange={(llm) => update({ llm })}
                />
              </div>
            )}

            {/* 3. Classes & Descriptions/Patterns Editor */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Classification Classes
              </label>
              <VariableLinker 
                targetType={['schema_list', 'list']} 
                onSelect={(variable) => {
                  if (variable.var_type === 'schema_list') {
                    update({ classification_classes: variable.value.map(item => ({ class: item.name, description: item.description || '' })) });
                  } else if (variable.var_type === 'list') {
                    update({ classification_classes: variable.value.map(name => ({ class: name, description: '' })) });
                  }
                }}
                tooltip="Load from Variable"
              />
            </div>
            <ClassificationClassesEditor
              value={data.classification_classes || []}
              onChange={(v) => update({ classification_classes: v })}
              engine={data.classification_engine || 'llm'}
            />

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '20px 0', opacity: 0.5 }} />

            {/* 4. Summary toggle (only for LLM engine) */}
            {data.classification_engine !== 'regex' && (
              <>
                <div style={{ marginBottom: 18 }}>
                  <Toggle
                    checked={data.classification_summary === true}
                    onChange={(v) => update({ classification_summary: v })}
                    label="Summarize Classified Content"
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, marginLeft: 28, marginBottom: 20 }}>
                    If enabled, the node will return a summary of the input data instead of the original raw data.
                  </div>
                </div>
                <div style={{ marginBottom: 18 }}>
                  <Toggle
                    checked={data.classification_extract_identifiers === true}
                    onChange={(v) => update({ classification_extract_identifiers: v })}
                    label="Extract Identifiers (NER)"
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, marginLeft: 28, marginBottom: 20 }}>
                    If enabled, dynamically extracts key reference IDs (e.g. Govt IDs, Account Numbers) into an array.
                  </div>
                </div>
              </>
            )}

            {/* 5. Optional Input Field Path (Moved to Bottom) */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 6 }}>
                Input Field Path (Optional)
              </label>
              <Input
                value={data.classification_input_field || ''}
                onChange={(v) => update({ classification_input_field: v })}
                placeholder="e.g. context.customer_query"
              />
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                Variables path to classify. If empty, falls back to latest message or payload.
              </div>
            </div>

            <div style={{
              padding: '12px 14px',
              background: '#F0F9FF',
              borderRadius: 10,
              fontSize: 11,
              color: '#0369A1',
              border: '1px solid #BAE6FD',
              lineHeight: 1.5,
              marginTop: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <FiInfo size={14} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, fontWeight: 500 }}>
                Classification Agent: Classifies the incoming message or payload into one of your custom classes using {data.classification_engine === 'regex' ? 'Regex rules' : 'the configured LLM'}. Returns a JSON object with keys <strong>class</strong> and either <strong>original_data</strong> or <strong>summary</strong>.
              </span>
            </div>
          </>
        )}

        {data.type === 'sensitivity_classifier' && (
          <SensitivityClassifierConfig data={data} update={update} setShowGlobalRuleModal={setShowGlobalRuleModal} />
        )}

        {/* ── OCR Node ── */}
        {/* ── Ingestion Node ── */}
        {/* ── Classification Node ── */}
        {data.type === 'classification' && (
          <>
            {/* 1. Classification Engine Selection */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 6 }}>
                Classification Engine
              </label>
              <Select
                value={data.classification_engine || 'llm'}
                onChange={(v) => update({ classification_engine: v })}
                options={[
                  { value: 'llm', label: 'LLM (AI Classifier)' },
                  { value: 'regex', label: 'Regex Patterns (Static Classifier)' }
                ]}
              />
            </div>

            {/* 2. LLM Model Selection (only if LLM engine is selected) */}
            {data.classification_engine !== 'regex' && (
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FiCpu size={12} /> Model Settings
                </div>
                <LLMConfigSection
                  llm={data.llm || { provider: 'groq', model: 'llama-3.3-70b-versatile', temperature: 0 }}
                  onChange={(llm) => update({ llm })}
                />
              </div>
            )}

            {/* 3. Classes & Descriptions/Patterns Editor */}
            <ClassificationClassesEditor
              value={data.classification_classes || []}
              onChange={(v) => update({ classification_classes: v })}
              engine={data.classification_engine || 'llm'}
            />

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '20px 0', opacity: 0.5 }} />

            {/* 4. Summary toggle (only for LLM engine) */}
            {data.classification_engine !== 'regex' && (
              <div style={{ marginBottom: 18 }}>
                <Toggle
                  checked={data.classification_summary === true}
                  onChange={(v) => update({ classification_summary: v })}
                  label="Summarize Classified Content"
                />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, marginLeft: 28, marginBottom: 20 }}>
                  If enabled, the node will return a summary of the input data instead of the original raw data.
                </div>
              </div>
            )}

            {/* 5. Optional Input Field Path */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 6 }}>
                Input Field Path (Optional)
              </label>
              <Input
                value={data.classification_input_field || ''}
                onChange={(v) => update({ classification_input_field: v })}
                placeholder="e.g. context.customer_query"
              />
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                Variables path to classify. If empty, falls back to latest message or payload.
              </div>
            </div>

            <div style={{
              padding: '12px 14px',
              background: '#F0F9FF',
              borderRadius: 10,
              fontSize: 11,
              color: '#0369A1',
              border: '1px solid #BAE6FD',
              lineHeight: 1.5,
              marginTop: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <FiInfo size={14} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, fontWeight: 500 }}>
                Classification Agent: Classifies the incoming message or payload into one of your custom classes using {data.classification_engine === 'regex' ? 'Regex rules' : 'the configured LLM'}. Returns a JSON object with keys <strong>class</strong> and either <strong>original_data</strong> or <strong>summary</strong>.
              </span>
            </div>
          </>
        )}

        {data.type === 'ingestion_node' && (
          <>
            <Field label="Vector Store" hint="Target database for indexing.">
              <Select
                value={data.vector_store || 'chroma'}
                onChange={(v) => update({ vector_store: v })}
                options={[
                  { value: 'chroma', label: 'ChromaDB (Local)' },
                  { value: 'qdrant', label: 'Qdrant (Cloud/Local)' }
                ]}
              />
            </Field>
            <Field label="Collection Name" hint="Grouping key for your data.">
              <Input value={data.vector_collection || 'default'} onChange={(v) => update({ vector_collection: v })} placeholder="e.g. documentation" />
            </Field>

            <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
              <div style={{ flex: 1 }}>
                <Field label="Chunk Size" hint="Chars per block.">
                  <Input
                    type="number"
                    value={data.chunk_size ?? 1000}
                    onChange={(v) => update({ chunk_size: v === '' ? '' : parseInt(v) })}
                  />
                </Field>
              </div>
              <div style={{ flex: 1 }}>
                <Field label="Overlap" hint="Context padding.">
                  <Input
                    type="number"
                    value={data.chunk_overlap ?? 100}
                    onChange={(v) => update({ chunk_overlap: v === '' ? '' : parseInt(v) })}
                  />
                </Field>
              </div>
            </div>

            <Field label="Chunking Strategy">
              <Select
                value={data.chunking_strategy || 'recursive'}
                onChange={(v) => update({ chunking_strategy: v })}
                options={[
                  { value: 'recursive', label: 'Recursive Character (Smart)' },
                  { value: 'token', label: 'Token-based (Exact)' },
                  { value: 'json', label: 'JSON Strategy (Structured)' },
                  { value: 'none', label: 'None (No Chunking)' }
                ]}
              />
            </Field>

            <Field label="Source Context Key" hint="Leave empty to ingest the latest chat message.">
              <Input
                value={data.ingestion_source_key || ''}
                onChange={(v) => update({ ingestion_source_key: v })}
                placeholder="e.g. latest_ocr_output"
              />
            </Field>

            <div style={{ padding: 12, background: '#F0F9FF', borderRadius: 10, fontSize: 11, color: '#0369A1', border: '1px solid #BAE6FD', marginTop: 10 }}>
              <FiBox size={12} style={{ marginRight: 6 }} />
              This node automatically splits large text into searchable chunks and saves them in your vector database.
            </div>
          </>
        )}

        {/* ── RAG Node ── */}
        {data.type === 'rag_node' && (
          <>
            {/* RAG Task Instructions */}
            <Field
              label="Task"
              hint="Additional instructions appended to the internal RAG logic. Use this to refine how the agent answers (e.g. 'Answer in bullet points')."
              action={
                <WizardButton
                  onClick={() => handleFixGrammar('task')}
                  loading={fixingGrammar}
                  disabled={!data.task}
                />
              }
            >
              <Textarea
                value={data.task}
                onChange={(v) => update({ task: v })}
                placeholder="e.g. Always respond in bullet points and be very concise."
                rows={4}
              />
            </Field>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Query LLM</div>
              <LLMConfigSection llm={data.llm} onChange={(v) => update({ llm: v })} />
            </div>

            <Field label="Vector Store">
              <Select
                value={data.vector_store || 'chroma'}
                onChange={(v) => update({ vector_store: v })}
                options={[
                  { value: 'chroma', label: 'ChromaDB (Local)' },
                  { value: 'qdrant', label: 'Qdrant (Cloud/Local)' }
                ]}
              />
            </Field>
            <Field label="Collection Name">
              <Input value={data.vector_collection || 'default'} onChange={(v) => update({ vector_collection: v })} />
            </Field>

            <Field label="Search Type" hint="Similarity: semantic search. Hybrid: Vector + Keyword (BM25). Keyword: Exact text match.">
              <Select
                value={data.search_type || 'similarity'}
                onChange={(v) => update({ search_type: v })}
                options={[
                  { value: 'similarity', label: 'Similarity (Vector)' },
                  { value: 'hybrid', label: 'Hybrid (Vector + Keyword)' },
                  { value: 'keyword', label: 'Keyword (Lexical/BM25)' }
                ]}
              />
            </Field>

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <Field label="Top K Results" hint="Number of chunks to fetch.">
                  <Input
                    type="number"
                    value={data.k_results ?? 5}
                    onChange={(v) => update({ k_results: v === '' ? '' : parseInt(v) })}
                  />
                </Field>
              </div>
              <div style={{ flex: 1 }}>
                <Field label="Threshold" hint="0.0 (Loose) to 1.0 (Exact).">
                  <Input
                    type="number"
                    step="0.1"
                    value={data.threshold ?? 0.5}
                    onChange={(v) => update({ threshold: v === '' ? '' : parseFloat(v) })}
                  />
                </Field>
              </div>
            </div>


            <div style={{ padding: 12, background: '#FFF7ED', borderRadius: 10, fontSize: 11, color: '#92400E', border: '1px solid #FED7AA', marginTop: 10 }}>
              <Field label="Show Citations" hint="If enabled, source filenames will be appended to retrieved document chunks.">
                <Toggle
                  checked={data.show_citations || false}
                  onChange={(v) => update({ show_citations: v })}
                  label=""
                />
              </Field>
            </div>

            <div style={{ padding: 12, background: '#FFF7ED', borderRadius: 10, fontSize: 11, color: '#92400E', border: '1px solid #FED7AA', marginTop: 10 }}>
              <FiBookOpen size={12} style={{ marginRight: 6 }} />
              The RAG node searches your vector database for relevant info and uses an LLM to generate an answer based only on those results.
            </div>
          </>
        )}

        {data.type === 'ocr_node' && (
          <>
            <Field label="OCR Mode" hint="Vision uses Cloud LLMs; Standard uses local engines; External sends files to an API service (e.g., DocBot).">
              <Select
                value={data.ocr_engine || 'vision'}
                onChange={(v) => update({ ocr_engine: v })}
                options={[
                  { value: 'vision', label: 'Vision OCR (AI/LLM)' },
                  { value: 'standard', label: 'Standard OCR (Local)' },
                  { value: 'external', label: 'External Service (API)' }
                ]}
              />
            </Field>

            {/* ── Vision Engine Config ── */}
            {(data.ocr_engine || 'vision') === 'vision' && (
              <>
                <Field label="OCR Instruction / Prompt" hint="Instruction for the vision model. Be specific about what data to extract.">
                  <Textarea value={data.ocr_prompt} onChange={(v) => update({ ocr_prompt: v })} placeholder="e.g. Extract all text from this receipt accurately..." />
                </Field>

                <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FiZap size={12} color="var(--accent-btn)" /> Vision Model Config
                  </div>
                  <LLMConfigSection llm={data.llm} onChange={(v) => update({ llm: v })} />
                </div>
              </>
            )}

            {data.ocr_engine === 'standard' && (
              <div style={{ padding: '16px', background: 'var(--bg-card-neutral, #F8FAFC)', borderRadius: 12, border: '1px solid var(--border)', marginTop: 10 }}>
                <Field label="Local OCR Engine" hint="Select the local model installed on your server.">
                  <Select
                    value={data.ocr_standard_model || 'tesseract'}
                    onChange={(v) => update({ ocr_standard_model: v })}
                    options={[
                      { value: 'tesseract', label: 'Tesseract OCR' },
                      { value: 'chandra', label: 'Chandra OCR' },
                      { value: 'surya', label: 'Surya OCR' }
                    ]}
                  />
                </Field>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FiSettings size={12} /> Running on local CPU/GPU resources.
                </div>
              </div>
            )}

            {/* ── External Service Engine Config ── */}
            {data.ocr_engine === 'external' && (
              <>
                <div style={{ padding: 16, background: '#FFF7ED', borderRadius: 12, border: '1px solid #FED7AA', marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9A3412', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>External OCR Service</div>

                  <Field label="Service URL" hint="Full URL of the extraction API endpoint.">
                    <Input
                      value={data.ocr_service_url || ''}
                      onChange={(v) => update({ ocr_service_url: v })}
                      placeholder="http://localhost:8003/api/ocr/upload"
                    />
                  </Field>

                  <Field label="Response Type" hint="How the service returns data.">
                    <Select
                      value={data.ocr_service_response_type || 'sse'}
                      onChange={(v) => update({ ocr_service_response_type: v })}
                      options={[
                        { value: 'sse', label: 'SSE Stream (Server-Sent Events)' },
                        { value: 'json', label: 'JSON (Standard Response)' }
                      ]}
                    />
                  </Field>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <Field label="File Field Name" hint="Multipart form field name for file.">
                        <Input value={data.ocr_service_file_field || 'files'} onChange={(v) => update({ ocr_service_file_field: v })} placeholder="files" />
                      </Field>
                    </div>
                    <div style={{ flex: 1 }}>
                      <Field label="Text Path in Response" hint="Dot-path to extracted text in each event/result.">
                        <Input value={data.ocr_service_text_path || 'data.text'} onChange={(v) => update({ ocr_service_text_path: v })} placeholder="data.text" />
                      </Field>
                    </div>
                  </div>
                </div>

                <KeyValueEditor
                  label="Service Form Fields"
                  value={data.ocr_service_params || {}}
                  onChange={(v) => update({ ocr_service_params: v })}
                  hint="Extra fields sent with the file (e.g., provider: groq, mask_pii: true)"
                />

                <KeyValueEditor
                  label="Service Headers"
                  value={data.ocr_service_headers || {}}
                  onChange={(v) => update({ ocr_service_headers: v })}
                  hint="Optional headers (e.g., Authorization: Bearer xxx)"
                />

                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0', opacity: 0.5 }} />

                <Field label="Multi-File Input Key (Optional)" hint="Context key containing a list of uploaded file objects (e.g., payload.uploaded_files). If set, processes ALL files.">
                  <Input
                    value={data.ocr_multi_file_key || ''}
                    onChange={(v) => update({ ocr_multi_file_key: v })}
                    placeholder="e.g. payload.uploaded_files"
                  />
                </Field>
              </>
            )}

              <div style={{ marginTop: 12, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #BBF7D0' }}>
                <Toggle
                  checked={data.pii_verification === true}
                  onChange={(v) => update({ pii_verification: v })}
                  label="Legacy PII Verification Gate (Deprecated)"
                />
                <div style={{ fontSize: 10, color: '#059669', marginTop: 4, marginLeft: 28 }}>
                  [Legacy CD workflows only]. Use the dedicated PII Gate Node instead.
                </div>
              </div>

            <div style={{ marginTop: 16 }}>
              <Field label="Destination Key" hint="The context key where OCR results are saved. Defaults to 'latest_ocr_output'.">
                <Input
                  value={data.destination_key || 'latest_ocr_output'}
                  onChange={(v) => update({ destination_key: v })}
                  placeholder="latest_ocr_output"
                />
              </Field>
            </div>

            <div style={{
              padding: '12px 14px', background: '#F8FAFC', borderRadius: 10, fontSize: 11, color: 'var(--text-secondary)',
              border: '1px solid var(--border)', lineHeight: 1.5, marginTop: 18, display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between'
            }}>
              <span style={{ flex: 1, fontWeight: 500 }}>
                {data.ocr_engine === 'external'
                  ? "External Mode: Sends files to a remote OCR/extraction service via multipart upload."
                  : data.ocr_engine === 'standard'
                    ? `Standard Mode: Best for high-speed, plain text extraction using ${data.ocr_standard_model || 'tesseract'}.`
                    : "Vision Mode: Best for complex layouts, handwriting, and tables using AI."
                }
              </span>
              <FiCamera size={16} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
            </div>

            <div style={{ marginTop: 24, padding: 16, border: '1px solid #E2E8F0', borderRadius: 12, background: '#F8FAFC' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Execution Control</div>
              <Toggle
                checked={data.interrupt_after || false}
                onChange={(v) => update({ interrupt_after: v })}
                label="Pause Workflow After Node (interrupt_after)"
              />
              <div style={{ fontSize: 10, color: '#64748B', marginTop: 4, marginLeft: 28 }}>
                The execution engine will halt and wait for external input/resumption.
              </div>
            </div>
          </>
        )}

        {/* ── JSON Transform ── */}
        {data.type === 'json_transform_va' && (
          <>
            <Field label="Operation" hint="Choose how to transform the JSON data.">
              <Select
                value={data.transform_operation || 'flatten'}
                onChange={(v) => update({ transform_operation: v })}
                options={[
                  { value: 'flatten', label: 'Flatten (nested → flat keys)' },
                  { value: 'pick', label: 'Pick (keep only listed fields)' },
                  { value: 'rename', label: 'Rename (change key names)' },
                  { value: 'omit', label: 'Omit (remove specific keys)' }
                ]}
              />
            </Field>

            <Field label="Input Key" hint="Context variable containing the JSON data.">
              <Input value={data.transform_input_key || 'payload'} onChange={(v) => update({ transform_input_key: v })} placeholder="payload" />
            </Field>

            <Field label="Output Key" hint="Context variable where the result will be stored.">
              <Input value={data.transform_output_key || 'transformed_json'} onChange={(v) => update({ transform_output_key: v })} placeholder="transformed_json" />
            </Field>

            {(data.transform_operation || 'flatten') === 'flatten' && (
              <Field label="Separator" hint="Character between nested key segments (e.g., '/' → 'basic_info/name').">
                <Input value={data.transform_separator || '/'} onChange={(v) => update({ transform_separator: v })} placeholder="/" />
              </Field>
            )}

            {(data.transform_operation) === 'pick' && (
              <Field 
                label={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    Fields to Pick
                    <VariableLinker 
                      targetType="json_keys"
                      onSelect={(variable) => {
                        const current = data.transform_pick_fields || [];
                        update({ transform_pick_fields: [...new Set([...current, ...variable.value])] });
                      }}
                      tooltip="Pick from JSON Keys"
                    />
                  </div>
                } 
                hint="Comma-separated list of field paths to keep (e.g., name,address.city)."
              >
                <CommaArrayEditor
                  value={data.transform_pick_fields}
                  onChange={(v) => update({ transform_pick_fields: v })}
                  placeholder="name, age, address.city"
                  isTextarea={true}
                  rows={3}
                />
              </Field>
            )}

            {(data.transform_operation) === 'rename' && (
              <KeyValueEditor
                label={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    Rename Map (Old Key → New Key)
                    <VariableLinker 
                      targetType="json_keys"
                      onSelect={(variable) => {
                        const current = data.transform_rename_map || {};
                        const next = { ...current };
                        variable.value.forEach(k => {
                          if (!(k in next)) next[k] = '';
                        });
                        update({ transform_rename_map: next });
                      }}
                      tooltip="Pick from JSON Keys"
                    />
                  </div>
                }
                value={data.transform_rename_map || {}}
                onChange={(v) => update({ transform_rename_map: v })}
                hint="Left = original key name, Right = new key name"
              />
            )}

            {(data.transform_operation) === 'omit' && (
              <Field 
                label={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    Keys to Omit
                    <VariableLinker 
                      targetType="json_keys"
                      onSelect={(variable) => {
                        const current = data.transform_omit_keys || [];
                        update({ transform_omit_keys: [...new Set([...current, ...variable.value])] });
                      }}
                      tooltip="Pick from JSON Keys"
                    />
                  </div>
                }
                hint="Comma-separated list of keys to remove."
              >
                <CommaArrayEditor
                  value={data.transform_omit_keys}
                  onChange={(v) => update({ transform_omit_keys: v })}
                  placeholder="ssn, password, internal_id"
                  isTextarea={true}
                  rows={3}
                />
              </Field>
            )}

            <div style={{
              padding: '12px 14px', background: '#F0F9FF', borderRadius: 10, fontSize: 11, color: '#0369A1',
              border: '1px solid #BAE6FD', lineHeight: 1.5, marginTop: 12, display: 'flex', alignItems: 'center', gap: 10
            }}>
              <FiInfo size={14} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, fontWeight: 500 }}>
                JSON Transform processes structured data from APIs, uploads, or previous nodes. Use "Flatten" for nested JSON → flat keys before Pattern Extraction.
              </span>
            </div>
          </>
        )}

        {/* ── Pattern Extractor ── */}
        {data.type === 'pattern_extract' && (
          <>
            <Field label="Extraction Mode" hint="Identifier: extract labeled values. Field Mapper: group by target class.">
              <Select
                value={data.extract_mode || 'identifier'}
                onChange={(v) => update({ extract_mode: v })}
                options={[
                  { value: 'identifier', label: 'Identifier (ID, Name, Account No.)' },
                  { value: 'field_mapper', label: 'Field Mapper (group by agent class)' },
                  { value: 'text_renderer', label: 'Text Renderer (Generate ocr_like_results)' }
                ]}
              />
            </Field>

            <Field label="Input Key" hint="Context variable containing the flat dictionary to scan.">
              <Input value={data.extract_input_key || 'transformed_json'} onChange={(v) => update({ extract_input_key: v })} placeholder="transformed_json" />
            </Field>

            <Field label="Output Key" hint="Context variable where extraction results are stored.">
              <Input value={data.extract_output_key || ((data.extract_mode || 'identifier') === 'identifier' ? 'extracted_identifiers' : (data.extract_mode === 'text_renderer' ? 'ocr_like_results' : 'mapped_fields'))} onChange={(v) => update({ extract_output_key: v })} placeholder="extracted_identifiers" />
            </Field>

            {data.extract_mode === 'text_renderer' && (
              <Field label="Identifiers Input Key" hint="Context variable containing previously extracted identifiers (for merging).">
                <Input value={data.identifiers_input_key || 'extracted_identifiers'} onChange={(v) => update({ identifiers_input_key: v })} placeholder="extracted_identifiers" />
              </Field>
            )}

            {/* Pattern list editor */}
            {data.extract_mode !== 'text_renderer' && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Patterns ({(data.extract_patterns || []).length})
                </label>
                {data.extract_mode !== 'field_mapper' && (
                  <button
                    onClick={() => update({
                      extract_patterns: [
                        ...(data.extract_patterns || []),
                        {
                          concept: '',
                          display_label: '',
                          search_keywords: [],
                          match_strategy: 'contains',
                          is_required: false,
                          target_class: (data.extract_mode || 'identifier') === 'field_mapper' ? '' : undefined
                        }
                      ]
                    })}
                    style={{
                      background: 'none', border: 'none', color: 'var(--accent-btn)',
                      cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center',
                      borderRadius: 4
                    }}
                  >
                    <FiPlus size={16} strokeWidth={3} />
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(() => {
                  const renderPatternRow = (pattern, idx) => (
                    <div key={idx} style={{ padding: 10, background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--border)', position: 'relative' }}>
                      <button
                        onClick={() => {
                          const next = [...(data.extract_patterns || [])];
                          next.splice(idx, 1);
                          update({ extract_patterns: next });
                        }}
                        style={{ position: 'absolute', top: 6, right: 6, background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                      >
                        <FiX size={12} />
                      </button>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
                        <div>
                          <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>CONCEPT</label>
                          <Input
                            value={pattern.concept || ''}
                            onChange={(v) => {
                              const next = [...(data.extract_patterns || [])];
                              next[idx] = { ...next[idx], concept: v, display_label: next[idx].display_label || v };
                              update({ extract_patterns: next });
                            }}
                            placeholder="e.g. ID_Number"
                            style={{ padding: '4px 8px', fontSize: 11 }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>DISPLAY LABEL</label>
                          <Input
                            value={pattern.display_label || ''}
                            onChange={(v) => {
                              const next = [...(data.extract_patterns || [])];
                              next[idx] = { ...next[idx], display_label: v };
                              update({ extract_patterns: next });
                            }}
                            placeholder="e.g. ID Number"
                            style={{ padding: '4px 8px', fontSize: 11 }}
                          />
                        </div>
                      </div>

                      <div style={{ marginBottom: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                          <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', display: 'block' }}>SEARCH KEYWORDS (comma-separated)</label>
                          <VariableLinker 
                            targetType="json_keys" 
                            onSelect={(variable) => {
                              const next = [...(data.extract_patterns || [])];
                              const current = next[idx].search_keywords || [];
                              next[idx] = { ...next[idx], search_keywords: [...new Set([...current, ...variable.value])] };
                              update({ extract_patterns: next });
                            }}
                            tooltip="Pick from JSON Keys"
                          />
                        </div>
                        <CommaArrayEditor
                          value={pattern.search_keywords}
                          onChange={(v) => {
                            const next = [...(data.extract_patterns || [])];
                            next[idx] = { ...next[idx], search_keywords: v };
                            update({ extract_patterns: next });
                          }}
                          placeholder="id, id_number, account"
                          style={{ padding: '4px 8px', fontSize: 11 }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                        <div>
                          <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>STRATEGY</label>
                          <Select
                            value={pattern.match_strategy || 'contains'}
                            onChange={(v) => {
                              const next = [...(data.extract_patterns || [])];
                              next[idx] = { ...next[idx], match_strategy: v };
                              update({ extract_patterns: next });
                            }}
                            options={[
                              { value: 'contains', label: 'Contains' },
                              { value: 'exact', label: 'Exact Match' },
                              { value: 'starts_with', label: 'Starts With' },
                              { value: 'ends_with', label: 'Ends With' },
                              { value: 'regex', label: 'Regex' }
                            ]}
                          />
                        </div>
                        {data.extract_mode !== 'field_mapper' && (
                          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
                            <Toggle
                              checked={pattern.is_required || false}
                              onChange={(v) => {
                                const next = [...(data.extract_patterns || [])];
                                next[idx] = { ...next[idx], is_required: v };
                                update({ extract_patterns: next });
                              }}
                              label="Required"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );

                  if (data.extract_mode === 'field_mapper') {
                    const grouped = (data.extract_patterns || []).reduce((acc, p, idx) => {
                      const tc = p.target_class || 'Unassigned';
                      if (!acc[tc]) acc[tc] = [];
                      acc[tc].push({ ...p, originalIndex: idx });
                      return acc;
                    }, {});

                    return (
                      <>
                        {Object.entries(grouped).map(([tc, groupPatterns]) => (
                          <div key={tc} style={{ padding: 12, background: 'white', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8, boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 4 }}>
                              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>CLASS:</span>
                                <VariableDropdown
                                  value={tc === 'Unassigned' ? '' : tc}
                                  onChange={(newClass) => {
                                    const next = [...(data.extract_patterns || [])];
                                    groupPatterns.forEach(p => {
                                      next[p.originalIndex].target_class = newClass;
                                    });
                                    update({ extract_patterns: next });
                                  }}
                                  placeholder="Select Target Class"
                                  style={{ padding: '4px 8px', fontSize: 12, fontWeight: 600, border: 'none', background: 'transparent', color: 'var(--theme-primary)', minWidth: 200, outline: 'none' }}
                                />
                              </div>
                              <button
                                onClick={() => {
                                  const next = [...(data.extract_patterns || [])];
                                  next.push({
                                    concept: '', display_label: '', search_keywords: [],
                                    match_strategy: 'contains', is_required: false, target_class: tc !== 'Unassigned' ? tc : ''
                                  });
                                  update({ extract_patterns: next });
                                }}
                                style={{ background: 'none', border: 'none', color: 'var(--accent-btn)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700 }}
                              >
                                <FiPlus size={12} /> ADD FIELD
                              </button>
                            </div>
                            {groupPatterns.map(p => renderPatternRow(p, p.originalIndex))}
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const next = [...(data.extract_patterns || [])];
                            next.push({ concept: '', display_label: '', search_keywords: [], match_strategy: 'contains', is_required: false, target_class: '' });
                            update({ extract_patterns: next });
                          }}
                          style={{ padding: '8px', background: 'var(--bg-hover)', border: '1px dashed var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontWeight: 600, fontSize: 11, cursor: 'pointer', marginTop: 4, width: '100%' }}
                        >
                          + ADD TARGET CLASS GROUP
                        </button>
                      </>
                    );
                  }

                  return (data.extract_patterns || []).map((pattern, idx) => renderPatternRow(pattern, idx));
                })()}
                {(data.extract_patterns || []).length === 0 && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
                    No patterns defined. Click the plus button above to add patterns.
                  </div>
                )}
              </div>
            </div>
            )}

            <div style={{
              padding: '12px 14px', background: '#FDF2F8', borderRadius: 10, fontSize: 11, color: '#DB2777',
              border: '1px solid #FBCFE8', lineHeight: 1.5, marginTop: 12, display: 'flex', alignItems: 'center', gap: 10
            }}>
              <FiSearch size={14} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, fontWeight: 500 }}>
                {(data.extract_mode || 'identifier') === 'identifier'
                  ? 'Identifier mode finds labeled values (ID, Name, etc.) from flat JSON keys. Connect after a JSON Transform node.'
                  : 'Field Mapper mode groups extracted values by target class (class_1, class_2, etc.) for routing.'
                }
              </span>
            </div>
          </>
        )}

        {/* ── MongoDB Node ── */}
        {data.type === 'db_node' && (
          <>
            <Field label="Operation" hint="Choose the MongoDB CRUD operation.">
              <Select
                value={data.db_operation || 'insert_one'}
                onChange={(v) => update({ db_operation: v })}
                options={[
                  { value: 'insert_one', label: 'Insert One' },
                  { value: 'insert_many', label: 'Insert Many' },
                  { value: 'find_one', label: 'Find One' },
                  { value: 'find_many', label: 'Find Many' },
                  { value: 'update_one', label: 'Update One' },
                  { value: 'delete_one', label: 'Delete One' }
                ]}
              />
            </Field>

            <Field label="Connection String" hint="MongoDB URI. Leave blank to use backend MONGODB_URI env var.">
              <Input
                value={data.db_connection_string || ''}
                onChange={(v) => update({ db_connection_string: v || null })}
                placeholder="mongodb://localhost:27017 (or leave blank)"
                type="password"
              />
            </Field>

            <Field label="Database Name" hint="Target MongoDB database.">
              <Input value={data.db_database || ''} onChange={(v) => update({ db_database: v })} placeholder="e.g. credit_decisioning" />
            </Field>

            <Field label="Collection Name" hint="Target MongoDB collection. Supports {{context.xxx}} interpolation.">
              <Input value={data.db_collection || ''} onChange={(v) => update({ db_collection: v })} placeholder="e.g. customer_profiles" />
            </Field>

            {['insert_one', 'insert_many', 'update_one'].includes(data.db_operation || 'insert_one') && (
              <Field label="Document Template" hint="JSON template with {{context.xxx}} placeholders. Use {{__NOW__}} for current timestamp.">
                <Textarea
                  value={typeof data.db_document === 'string' ? data.db_document : JSON.stringify(data.db_document || {}, null, 2)}
                  onChange={(v) => {
                    try { update({ db_document: JSON.parse(v) }); } catch { update({ db_document: v }); }
                  }}
                  placeholder={'{\n  "name": "{{extracted_identifiers.0.value}}",\n  "status": "completed",\n  "created_at": "{{__NOW__}}"\n}'}
                  rows={8}
                />
              </Field>
            )}

            {['find_one', 'find_many', 'update_one', 'delete_one'].includes(data.db_operation || 'insert_one') && (
              <Field label="Query Filter" hint="MongoDB query filter with {{context.xxx}} placeholders.">
                <Textarea
                  value={typeof data.db_query === 'string' ? data.db_query : JSON.stringify(data.db_query || {}, null, 2)}
                  onChange={(v) => {
                    try { update({ db_query: JSON.parse(v) }); } catch { update({ db_query: v }); }
                  }}
                  placeholder={'{\n  "customer_uid": "{{customer_uid}}"\n}'}
                  rows={4}
                />
              </Field>
            )}

            {['find_one', 'find_many'].includes(data.db_operation || 'insert_one') && (
              <Field label="Output Key" hint="Context key to store query results.">
                <Input value={data.db_output_key || 'db_result'} onChange={(v) => update({ db_output_key: v })} placeholder="db_result" />
              </Field>
            )}

            {(data.db_operation || 'insert_one') === 'find_many' && (
              <Field label="Limit" hint="Maximum documents to return.">
                <Input type="number" value={data.db_limit || 100} onChange={(v) => update({ db_limit: parseInt(v) || 100 })} placeholder="100" />
              </Field>
            )}

            <div style={{
              padding: '12px 14px', background: '#D1FAE5', borderRadius: 10, fontSize: 11, color: '#065F46',
              border: '1px solid #A7F3D0', lineHeight: 1.5, marginTop: 12, display: 'flex', alignItems: 'center', gap: 10
            }}>
              <FiBox size={14} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, fontWeight: 500 }}>
                {'MongoDB node performs real database operations. Use {{context.xxx}} in document templates to inject workflow data dynamically.'}
              </span>
            </div>
          </>
        )}

        {/* ── PII Verification Gate ── */}
        {data.type === 'pii_gate_node' && (
          <>
            <div style={{
              padding: '14px 16px', background: '#F0FDF4', borderRadius: 12, fontSize: 12, color: '#166534',
              border: '1px solid #BBF7D0', lineHeight: 1.6, marginTop: 8, marginBottom: 16
            }}>
              <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 13 }}>🛡️ PII Verification Gate</div>
              <div style={{ color: '#14532D', fontSize: 11 }}>
                Pauses the workflow and saves a draft of the OCR results to the database for human review before allowing the pipeline to continue.
              </div>
            </div>

            <Field label="Input Key" hint="Context key containing the OCR extraction results.">
              <Input
                value={data.input_key || 'latest_ocr_output'}
                onChange={(v) => update({ input_key: v })}
                placeholder="latest_ocr_output"
              />
            </Field>

            <div style={{ marginTop: 24, padding: 16, border: '1px solid #E2E8F0', borderRadius: 12, background: '#F8FAFC' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Execution Control</div>
              <Toggle
                checked={data.interrupt_after !== false}
                onChange={(v) => update({ interrupt_after: v })}
                label="Pause Workflow For Human Review (interrupt_after)"
              />
              <div style={{ fontSize: 10, color: '#64748B', marginTop: 4, marginLeft: 28 }}>
                Essential for Human-in-the-Loop. The workflow will halt until the verification is completed in the dashboard.
              </div>
            </div>
          </>
        )}



        {data.type === 'ingestion_router' && (
          <>
            <Field label="Scan Mode" hint="How should this router handle the payload?">
              <Select
                value={data.scan_mode || 'auto'}
                onChange={(v) => update({ scan_mode: v })}
                options={[
                  { value: 'auto', label: 'Auto Detect' },
                  { value: 'files', label: 'Files Only' },
                  { value: 'directory', label: 'Directory Bulk Dispatch' }
                ]}
              />
            </Field>

            <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>Payload Keys Setup</div>
              
              <Field label="Parent Folder Key" hint="Key for macro-bulk processing (default: 'parent_folder_path').">
                <Input value={data.parent_folder_key || 'parent_folder_path'} onChange={(v) => update({ parent_folder_key: v })} placeholder="parent_folder_path" />
              </Field>
              
              <Field label="Folder / Item Identifier Key" hint="Key used to pass the item's name to the child workflow (default: 'customer_folder_name').">
                <Input value={data.folder_identifier_key || 'customer_folder_name'} onChange={(v) => update({ folder_identifier_key: v })} placeholder="customer_folder_name" />
              </Field>

              <Field label="cURL Command Key" hint="Key containing a cURL command string to execute for JSON endpoints (default: 'curl_command').">
                <Input value={data.curl_command_key || 'curl_command'} onChange={(v) => update({ curl_command_key: v })} placeholder="curl_command" />
              </Field>
            </div>

            <Field label="File Filters" hint="Comma-separated extensions for bulk directory scanning (e.g. .pdf, .jpg)">
              <CommaArrayEditor
                value={data.file_filters || ['.pdf', '.jpg', '.png', '.jpeg']}
                onChange={(v) => update({ file_filters: v })}
                placeholder=".pdf, .jpg, .png"
              />
            </Field>

            <Field label="Concurrency Limit" hint="Maximum number of parallel child workflows to spawn (Semaphore limit).">
              <Input
                type="number"
                value={data.concurrency_limit ?? 5}
                onChange={(v) => update({ concurrency_limit: v === '' ? '' : parseInt(v) })}
              />
            </Field>
          </>
        )}

        {data.type === 'event_emitter' && (
          <>
            <Field label="Webhook URL" hint="The URL to ping when the workflow reaches this node (e.g. for SSE sync).">
              <Input
                value={data.webhook_url || 'http://localhost:8000/documents/mesh-status-sync'}
                onChange={(v) => update({ webhook_url: v })}
                placeholder="http://localhost:8000/documents/mesh-status-sync"
              />
            </Field>
            
            <Field label="Emit Status" hint="Optional status to send in the payload (e.g., awaiting_classification_review)">
              <Input
                value={data.emit_status || ''}
                onChange={(v) => update({ emit_status: v })}
                placeholder="awaiting_classification_review"
              />
            </Field>

            <div style={{ height: '1px', background: 'var(--border)', margin: '16px 0' }} />
            
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>Human-in-the-Loop</div>
              <Toggle
                checked={data.interrupt_before === true}
                onChange={(v) => update({ interrupt_before: v, ...(v ? { interrupt_after: false } : {}) })}
                label="Pause BEFORE this node runs"
              />
              <div style={{ fontSize: 10, color: '#64748B', marginTop: 2, marginLeft: 28, marginBottom: 12 }}>
                Pauses the workflow before the webhook fires. Use when you want human approval before any notification is sent.
              </div>
              <Toggle
                checked={data.interrupt_after === true}
                onChange={(v) => update({ interrupt_after: v, ...(v ? { interrupt_before: false } : {}) })}
                label="Pause AFTER this node runs (Recommended for HITL Review)"
              />
              <div style={{ fontSize: 10, color: '#059669', marginTop: 2, marginLeft: 28 }}>
                Fires the webhook first (updates dashboard status), then pauses for human review. Best for classification verification workflows.
              </div>
            </div>
          </>
        )}




        {/* ── Sensitivity Classifier Node ── */}





        {/* ── Banking Data Enrichment Orchestrator ── */}

        {/* ── Rule Engine Node ── */}

        {/* ── Weightage System Node ── */}
        {data.type === 'weightage' && (
          <>
            <Field label="Output Context Key" hint="The context key where the final weightage scoring JSON breakdown is saved. Defaults to weightage_result.">
              <Input
                value={data.weightage_output_key ?? 'weightage_result'}
                onChange={(v) => update({ weightage_output_key: v })}
                placeholder="weightage_result"
              />
            </Field>

            <WeightageCategoriesEditor
              categories={data.weightage_categories || []}
              onChange={(cats) => update({ weightage_categories: cats })}
            />

            <div style={{
              padding: '12px 14px',
              background: 'var(--bg-card-info, #F0F9FF)',
              borderRadius: 10,
              fontSize: 11,
              color: 'var(--text-card-info, #0369A1)',
              border: '1px solid var(--border-card-info, #BAE6FD)',
              lineHeight: 1.5,
              marginTop: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <FiInfo size={14} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, fontWeight: 500 }}>
                Weightage Scoring: Evaluates dynamic conditions across categories and fields. Calculates total raw scores, maximum possible scores, and normalized percentages (0-100%). Supports Jinja2 variables (e.g. <code>{`{{anualcredit}}`}</code>).
              </span>
            </div>
          </>
        )}

        {/* ── Template Engine Node ── */}
        {data.type === 'template_node' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiFileText color="#3B82F6" size={14} /> Template Engine Settings
              </div>

              <Field label="Template Content" hint="Define your Jinja2/Markdown template. Use Jinja2 formatting (e.g., {{ latest_message }}, {{ user_input }}).">
                <Textarea
                  value={data.template_content ?? ''}
                  onChange={(v) => update({ template_content: v })}
                  placeholder="Hello {{ latest_message }},\n\nYour score is {{ total_score }} out of {{ max_possible_score }}."
                  rows={8}
                />
              </Field>

              <Field label="Template File Path (Optional)" hint="Provide an absolute path to a template file on the server. If set and file exists, its content overrides the Template Content text field above.">
                <Input
                  value={data.template_file_path ?? ''}
                  onChange={(v) => update({ template_file_path: v })}
                  placeholder="e.g. C:/templates/my_template.txt"
                />
              </Field>

              <Field label="Input Variable Data Key (Optional)" hint="Specify the context key (e.g., enriched_transaction) from which to extract variables to inject into the template context. If it points to a dictionary, those fields are merged into the template variables.">
                <Input
                  value={data.template_data_key ?? ''}
                  onChange={(v) => update({ template_data_key: v })}
                  placeholder="e.g. enriched_transaction"
                />
              </Field>

              <Field label="Output Context Key" hint="Context key to save the final rendered string output. Defaults to rendered_template.">
                <Input
                  value={data.template_output_key ?? 'rendered_template'}
                  onChange={(v) => update({ template_output_key: v })}
                  placeholder="rendered_template"
                />
              </Field>
            </div>

            <div style={{
              padding: '12px 14px',
              background: 'var(--bg-card-info, #F0F9FF)',
              borderRadius: 10,
              fontSize: 11,
              color: 'var(--text-card-info, #0369A1)',
              border: '1px solid var(--border-card-info, #BAE6FD)',
              lineHeight: 1.5,
              marginTop: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <FiInfo size={14} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, fontWeight: 500 }}>
                Template Engine Node: Renders dynamic text or markdown using Jinja2 formatting. The global context, <code>latest_message</code>, and values under the selected <code>Input Data Key</code> are all exposed to your template variables automatically.
              </span>
            </div>
          </>
        )}

        {/* ── Beneficiary Risk Router ── */}
        {data.type === 'beneficiary_risk' && (() => {
          const checks = data.risk_checks || ['mule_detection', 'account_age', 'sanctions_list', 'relationship_graph'];

          const toggleCheck = (key) => {
            const next = checks.includes(key) ? checks.filter(k => k !== key) : [...checks, key];
            update({ risk_checks: next });
          };

          const checkList = [
            { key: 'mule_detection', label: 'Mule Velocity Check', desc: 'Checks inbound velocity / mule indicators' },
            { key: 'account_age', label: 'Account Age Registry', desc: 'Checks if recipient account is new' },
            { key: 'sanctions_list', label: 'Sanctions Check', desc: 'Screens against OFAC & local blacklists' },
            { key: 'relationship_graph', label: 'Relationship Graph', desc: 'Checks history between sender and receiver' },
          ];

          return (
            <>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FiShield color="var(--theme-primary)" size={14} /> Risk Evaluator Checks
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {checkList.map((chk) => (
                    <div
                      key={chk.key}
                      onClick={() => toggleCheck(chk.key)}
                      style={{
                        padding: '10px 12px',
                        background: checks.includes(chk.key) ? 'rgba(142, 119, 187, 0.05)' : '#F8FAFC',
                        border: checks.includes(chk.key) ? '1.5px solid var(--theme-primary)' : '1px solid var(--border)',
                        borderRadius: 10,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginRight: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: checks.includes(chk.key) ? 'var(--theme-primary)' : 'var(--text-primary)' }}>{chk.label}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{chk.desc}</span>
                      </div>
                      <div style={{
                        width: 32, height: 18, borderRadius: 9, position: 'relative',
                        background: checks.includes(chk.key) ? 'var(--theme-primary)' : '#cbd5e1',
                        transition: 'all 0.2s', flexShrink: 0
                      }}>
                        <div style={{
                          position: 'absolute', top: 2, left: checks.includes(chk.key) ? 16 : 2, width: 14, height: 14,
                          borderRadius: '50%', background: '#fff', transition: 'left 0.2s ease'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, background: '#F8FAFC', marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#EF4444' }}>🔴</span> Known Fraudster Branch
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.4 }}>
                  Triggered only if deterministic check (Sanctions hit) matches 100%. Executes real-time block and raises alert.
                </p>
                <Field label="Fraud Alert API" hint="API endpoint to push immediate alert details.">
                  <Input value={data.fraud_api_endpoint ?? ''} onChange={(v) => update({ fraud_api_endpoint: v })} placeholder="https://api.bank.com/v1/fraud-alerts" />
                </Field>
                <Field label="Alert Severity Level" hint="Level of severity logged downstream.">
                  <Select
                    value={data.fraud_alert_level ?? 'CRITICAL'}
                    onChange={(v) => update({ fraud_alert_level: v })}
                    options={[
                      { value: 'CRITICAL', label: 'Critical' },
                      { value: 'HIGH', label: 'High' },
                      { value: 'MEDIUM', label: 'Medium' }
                    ]}
                  />
                </Field>
              </div>

              <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, background: '#F8FAFC', marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#F59E0B' }}>🟡</span> New Beneficiary Branch
                </div>
                <div style={{
                  padding: 10, background: '#FEF3C7', borderRadius: 8, border: '1px solid #FCD34D',
                  fontSize: 11, color: '#92400E', lineHeight: 1.4, marginBottom: 12, display: 'flex', gap: 6
                }}>
                  <FiShield size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>
                    <strong>Privacy Sandbox Active:</strong> This node strips private sender data and passes only recipient details (Name, Account, Bank) down the yellow wire for KYC/registration.
                  </span>
                </div>
              </div>

              <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, background: '#F8FAFC', marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#10B981' }}>🟢</span> Safe / Continue Branch
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                  Payload passes untouched. Mule check scores and geo-velocity metrics are injected into `risk_profile` for downstream scoring engines.
                </p>
              </div>

              <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, background: '#F8FAFC', marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Data Keys</div>
                <Field label="Input Context Key" hint="Context key that holds the transaction payload.">
                  <Input value={data.context_key ?? 'enriched_transaction'} onChange={(v) => update({ context_key: v })} placeholder="enriched_transaction" />
                </Field>
              </div>
              {data.type === 'template_node' && (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FiFileText color="#3B82F6" size={14} /> Template Engine Settings
                    </div>

                    <Field label="Template Content" hint="Define your Jinja2/Markdown template. Use Jinja2 formatting (e.g., {{ latest_message }}, {{ user_input }}).">
                      <Textarea
                        value={data.template_content ?? ''}
                        onChange={(v) => update({ template_content: v })}
                        placeholder="Hello {{ latest_message }},\n\nYour score is {{ total_score }} out of {{ max_possible_score }}."
                        rows={8}
                      />
                    </Field>

                    <Field label="Template File Path (Optional)" hint="Provide an absolute path to a template file on the server. If set and file exists, its content overrides the Template Content text field above.">
                      <Input
                        value={data.template_file_path ?? ''}
                        onChange={(v) => update({ template_file_path: v })}
                        placeholder="e.g. C:/templates/my_template.txt"
                      />
                    </Field>

                    <Field label="Input Variable Data Key (Optional)" hint="Specify the context key (e.g., enriched_transaction) from which to extract variables to inject into the template context. If it points to a dictionary, those fields are merged into the template variables.">
                      <Input
                        value={data.template_data_key ?? ''}
                        onChange={(v) => update({ template_data_key: v })}
                        placeholder="e.g. enriched_transaction"
                      />
                    </Field>

                    <Field label="Output Context Key" hint="Context key to save the final rendered string output. Defaults to rendered_template.">
                      <Input
                        value={data.template_output_key ?? 'rendered_template'}
                        onChange={(v) => update({ template_output_key: v })}
                        placeholder="rendered_template"
                      />
                    </Field>
                  </div>

                  <div style={{
                    padding: '12px 14px',
                    background: 'var(--bg-card-info, #F0F9FF)',
                    borderRadius: 10,
                    fontSize: 11,
                    color: 'var(--text-card-info, #0369A1)',
                    border: '1px solid var(--border-card-info, #BAE6FD)',
                    lineHeight: 1.5,
                    marginTop: 18,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <FiInfo size={14} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1, fontWeight: 500 }}>
                      Template Engine Node: Renders dynamic text or markdown using Jinja2 formatting. The global context, <code>latest_message</code>, and values under the selected <code>Input Data Key</code> are all exposed to your template variables automatically.
                    </span>
                  </div>
                </>
              )}
              {data.type === 'report_generator' && (
                <ReportGeneratorConfig data={data} update={update} />
              )}
              {data.type === 'ingestion_adapter' && (
                <>
                  <div style={{
                    padding: 16,
                    background: 'var(--bg-card-purple, #F5F3FF)',
                    borderRadius: 12,
                    border: '1px solid var(--border-card-purple, #DDD6FE)',
                    marginBottom: 24,
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #F3E8FF 0%, #E0E7FF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED', boxShadow: '0 2px 10px rgba(124, 58, 237, 0.1)' }}>
                        <FiInbox size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#1E293B', letterSpacing: '-0.3px' }}>Ingestion Configuration</div>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Banking schema normalization</div>
                      </div>
                    </div>

                    <Field label="Source Format" hint="Define how the incoming stream format will be identified.">
                      <Select
                        value={data.source_format || 'Auto-Detect'}
                        onChange={(v) => update({ source_format: v })}
                        options={[
                          { value: 'Auto-Detect', label: 'Auto-Detect Format (Dynamic)' },
                          { value: 'JSON', label: 'JSON' },
                          { value: 'XML', label: 'XML / SOAP' },
                          { value: 'CSV', label: 'CSV / Delimited' },
                          { value: 'ISO_8583', label: 'ISO 8583 (Card Switch)' }
                        ]}
                      />
                    </Field>

                    <Field label="Target Serialization" hint="Downstream message serialization target format.">
                      <Select
                        value={data.target_serialization || 'Canonical JSON'}
                        onChange={(v) => update({ target_serialization: v })}
                        options={[
                          { value: 'Canonical JSON', label: 'Canonical JSON' },
                          { value: 'CSV String', label: 'CSV String (MDM Flatfile)' },
                          { value: 'Raw Dictionary', label: 'Raw Dict Map' }
                        ]}
                      />
                    </Field>

                    <Field label="Destination Key" hint="The context field where the validated canonical payload will be saved.">
                      <Input
                        value={data.destination_key || 'canonical_transaction'}
                        onChange={(v) => update({ destination_key: v })}
                        placeholder="e.g. canonical_transaction"
                      />
                    </Field>

                    <div style={{ padding: '12px 16px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: 12, fontSize: 11, color: '#0369A1', border: '1px dashed rgba(59, 130, 246, 0.2)', lineHeight: 1.6, marginTop: 4 }}>
                      <strong>Auto-Normalization:</strong> Transaction streams, custom columns, and up to 200 dynamic fields are preserved automatically via the Pydantic pass-through schema config.
                    </div>
                  </div>
                </>
              )}
              {data.type === 'banking_enrichment' && (() => {
                const customExtList = data.custom_external_apis || [];
                const customIntList = data.custom_internal_apis || [];

                const extOptions = [
                  { value: 'custom', label: 'Custom HTTP API' },
                  { value: 'cibil_experian', label: 'CIBIL / Experian Bureau' },
                  { value: 'npci_registry', label: 'NPCI Fraud Registry' },
                  { value: 'sanctions_lists', label: 'OFAC / RBI Sanctions' },
                  { value: 'ip_geolocation', label: 'MaxMind IP Geolocation' },
                  { value: 'threat_metrix', label: 'ThreatMetrix Device ID' },
                  { value: 'telecom_data', label: 'Telecom Carrier API' }
                ];

                const intOptions = [
                  { value: 'custom', label: 'Custom HTTP API' },
                  { value: 'core_banking', label: 'Core Banking (CBS)' },
                  { value: 'card_management', label: 'Card Management (CMS)' },
                  { value: 'mobile_app_logs', label: 'Mobile App Session logs' },
                  { value: 'kyc_repository', label: 'KYC Registry' },
                  { value: 'crm_system', label: 'CRM System' }
                ];

                return (
                  <>
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiGlobe color="var(--theme-primary)" size={14} /> 1. External Third-Party Sources
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {customExtList.map((apiDef, idx) => (
                          <CustomCollapsibleApiConfig key={idx} apiDef={apiDef} index={idx} list={customExtList} keyName="custom_external_apis" update={update} providerOptions={extOptions} />
                        ))}

                        <div
                          onClick={() => {
                            const next = [...customExtList, { provider: 'custom', method: 'GET' }];
                            update({ custom_external_apis: next });
                          }}
                          style={{ marginTop: 10, padding: '10px 12px', background: 'rgba(124, 58, 237, 0.05)', border: '1px dashed var(--theme-primary)', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--theme-primary)', fontSize: 12, fontWeight: 600 }}
                        >
                          <FiPlus size={14} /> Add Source
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiLayers color="var(--theme-primary)" size={14} /> 2. Internal Bank Systems
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {customIntList.map((apiDef, idx) => (
                          <CustomCollapsibleApiConfig key={idx} apiDef={apiDef} index={idx} list={customIntList} keyName="custom_internal_apis" update={update} providerOptions={intOptions} />
                        ))}

                        <div
                          onClick={() => {
                            const next = [...customIntList, { provider: 'custom', method: 'GET' }];
                            update({ custom_internal_apis: next });
                          }}
                          style={{ marginTop: 10, padding: '10px 12px', background: 'rgba(124, 58, 237, 0.05)', border: '1px dashed var(--theme-primary)', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--theme-primary)', fontSize: 12, fontWeight: 600 }}
                        >
                          <FiPlus size={14} /> Add Source
                        </div>
                      </div>
                    </div>

                    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, background: '#F8FAFC', marginBottom: 20 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Data Keys</div>
                      <Field label="Source Context Key" hint="Key where canonical transaction data resides.">
                        <Input value={data.source_key ?? 'canonical_transaction'} onChange={(v) => update({ source_key: v })} placeholder="canonical_transaction" />
                      </Field>
                      <Field label="Destination Context Key" hint="Key to store the resulting enriched payload.">
                        <Input value={data.destination_key ?? 'enriched_transaction'} onChange={(v) => update({ destination_key: v })} placeholder="enriched_transaction" />
                      </Field>
                    </div>
                  </>
                );
              })()}
              {data.type === 'rule_engine' && (() => {
                const rules = data.python_rules || [];

                const addRule = () => {
                  const newRule = { id: Math.random().toString(36).substr(2, 9), name: `Rule ${rules.length + 1}`, code: '', enabled: true };
                  update({ python_rules: [...rules, newRule] });
                };

                const updateRule = (index, key, val) => {
                  const next = [...rules];
                  next[index] = { ...next[index], [key]: val };
                  update({ python_rules: next });
                };

                const removeRule = (index) => {
                  const next = [...rules];
                  next.splice(index, 1);
                  update({ python_rules: next });
                };

                const moveRule = (index, dir) => {
                  if (index + dir < 0 || index + dir >= rules.length) return;
                  const next = [...rules];
                  const temp = next[index];
                  next[index] = next[index + dir];
                  next[index + dir] = temp;
                  update({ python_rules: next });
                };

                return (
                  <>
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <FiShield color="#DC2626" size={14} /> Rule Engine Configuration
                        </div>
                        <button onClick={addRule} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#7C3AED', color: 'white', border: 'none', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                          <FiPlus size={12} /> Add Rule
                        </button>
                      </div>

                      {rules.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '20px', border: '1px dashed var(--border)', borderRadius: 8, color: 'var(--text-tertiary)', fontSize: 12 }}>
                          No rules defined. Click "Add Rule" to create one.
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {rules.map((rule, idx) => (
                          <RuleAccordionItem
                            key={rule.id}
                            rule={rule}
                            idx={idx}
                            totalRules={rules.length}
                            updateRule={updateRule}
                            removeRule={removeRule}
                            moveRule={moveRule}
                          />
                        ))}
                      </div>

                      <div style={{ background: 'var(--bg-card-info, #F0F9FF)', padding: 12, borderRadius: 8, border: '1px solid var(--border-card-info, #BAE6FD)', fontSize: 12, color: 'var(--text-card-info, #0369A1)', lineHeight: 1.5, marginTop: 12 }}>
                        <strong>Note:</strong> Rules execute sequentially. If an enabled rule sets <code>intent = 'block'</code>, execution stops instantly.
                      </div>
                    </div>
                  </>
                );
              })()}
              {data.type === 'beneficiary_risk' && (() => {
                const checks = data.risk_checks || ['mule_detection', 'account_age', 'sanctions_list', 'relationship_graph'];

                const toggleCheck = (key) => {
                  const next = checks.includes(key) ? checks.filter(k => k !== key) : [...checks, key];
                  update({ risk_checks: next });
                };

                const checkList = [
                  { key: 'mule_detection', label: 'Mule Velocity Check', desc: 'Checks inbound velocity / mule indicators' },
                  { key: 'account_age', label: 'Account Age Registry', desc: 'Checks if recipient account is new' },
                  { key: 'sanctions_list', label: 'Sanctions Check', desc: 'Screens against OFAC & local blacklists' },
                  { key: 'relationship_graph', label: 'Relationship Graph', desc: 'Checks history between sender and receiver' },
                ];

                return (
                  <>
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiShield color="var(--theme-primary)" size={14} /> Risk Evaluator Checks
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {checkList.map((chk) => (
                          <div
                            key={chk.key}
                            onClick={() => toggleCheck(chk.key)}
                            style={{
                              padding: '10px 12px',
                              background: checks.includes(chk.key) ? 'rgba(142, 119, 187, 0.05)' : '#F8FAFC',
                              border: checks.includes(chk.key) ? '1.5px solid var(--theme-primary)' : '1px solid var(--border)',
                              borderRadius: 10,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              transition: 'all 0.15s'
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginRight: 8 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: checks.includes(chk.key) ? 'var(--theme-primary)' : 'var(--text-primary)' }}>{chk.label}</span>
                              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{chk.desc}</span>
                            </div>
                            <div style={{
                              width: 32, height: 18, borderRadius: 9, position: 'relative',
                              background: checks.includes(chk.key) ? 'var(--theme-primary)' : '#cbd5e1',
                              transition: 'all 0.2s', flexShrink: 0
                            }}>
                              <div style={{
                                position: 'absolute', top: 2, left: checks.includes(chk.key) ? 16 : 2, width: 14, height: 14,
                                borderRadius: '50%', background: '#fff', transition: 'left 0.2s ease'
                              }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, background: '#F8FAFC', marginBottom: 20 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#EF4444' }}>🔴</span> Known Fraudster Branch
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.4 }}>
                        Triggered only if deterministic check (Sanctions hit) matches 100%. Executes real-time block and raises alert.
                      </p>
                      <Field label="Alert Severity Level" hint="Level of severity logged downstream.">
                        <Select
                          value={data.fraud_alert_level ?? 'CRITICAL'}
                          onChange={(v) => update({ fraud_alert_level: v })}
                          options={[
                            { value: 'CRITICAL', label: 'Critical' },
                            { value: 'HIGH', label: 'High' },
                            { value: 'MEDIUM', label: 'Medium' }
                          ]}
                        />
                      </Field>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase' }}>Primary Fraud Alert API</div>
                      <ApiConfigSection data={data} update={update} prefix="fraud_api_" urlKey="fraud_api_endpoint" />

                      <div style={{ marginTop: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase' }}>Additional APIs</div>
                        {data.fraud_additional_apis?.map((apiConf, idx) => {
                          const localUpdate = (changes) => {
                            const newArr = [...(data.fraud_additional_apis || [])];
                            newArr[idx] = { ...newArr[idx], ...changes };
                            update({ fraud_additional_apis: newArr });
                          };
                          return (
                            <CollapsibleApiConfig
                              key={idx}
                              data={apiConf}
                              update={localUpdate}
                              idx={idx}
                              onRemove={() => {
                                const newArr = [...data.fraud_additional_apis];
                                newArr.splice(idx, 1);
                                update({ fraud_additional_apis: newArr });
                              }}
                            />
                          );
                        })}
                        <button
                          onClick={() => {
                            const newArr = [...(data.fraud_additional_apis || []), { url: '', method: 'POST' }];
                            update({ fraud_additional_apis: newArr });
                          }}
                          style={{ width: '100%', padding: '8px', background: '#F1F5F9', border: '1px dashed #CBD5E1', borderRadius: '8px', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                        >
                          + Add Another API
                        </button>
                      </div>
                    </div>

                    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, background: '#F8FAFC', marginBottom: 20 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#F59E0B' }}>🟡</span> New Beneficiary Branch
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                        <strong>Privacy Sandbox Active:</strong> This node strips private sender data and passes only recipient details (Name, Account, Bank) down the yellow wire for KYC/registration.
                      </p>
                    </div>

                    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, background: '#F8FAFC', marginBottom: 20 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#10B981' }}>🟢</span> Safe / Continue Branch
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                        Payload passes untouched. Mule check scores and geo-velocity metrics are injected into `risk_profile` for downstream scoring engines.
                      </p>
                    </div>

                    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, background: '#F8FAFC', marginBottom: 20 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Data Configuration</div>
                      <Field label="Input Context Key" hint="Context key that holds the transaction payload.">
                        <Input value={data.context_key ?? 'enriched_transaction'} onChange={(v) => update({ context_key: v })} placeholder="enriched_transaction" />
                      </Field>
                      <Field label="Target Entity Field" hint="Which field in the data represents the beneficiary?">
                        <Input value={data.beneficiary_field ?? 'beneficiary_id'} onChange={(v) => update({ beneficiary_field: v })} placeholder="e.g., beneficiary_id" />
                      </Field>
                      <Field label="New Beneficiary Rule" hint="Logical condition to define what a 'new' beneficiary is.">
                        <Input value={data.new_beneficiary_rule ?? 'account_age_days < 1'} onChange={(v) => update({ new_beneficiary_rule: v })} placeholder="e.g., account_age_days < 1" />
                      </Field>
                    </div>
                  </>
                );
              })()}
            </>
          );
        })()}

        {/* Removed redundant Global Discovery Section */}


      </div>
      <SkillGallery isOpen={skillGalleryOpen} onClose={() => setSkillGalleryOpen(false)} />
      {saveModalOpen && (
        <SaveTemplateModal
          agentConfig={data}
          onClose={() => setSaveModalOpen(false)}
          onSaved={() => {
            // Success feedback is handled inside the modal or via parent
          }}
        />
      )}
    </div>
  );
}