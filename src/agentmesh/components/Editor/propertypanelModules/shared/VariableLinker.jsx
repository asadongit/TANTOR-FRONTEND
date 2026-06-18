import React, { useState, useEffect, useRef, memo, useMemo, useCallback } from 'react';
import { FiZap, FiX, FiSearch, FiChevronDown, FiCheck } from 'react-icons/fi';
import { useVariablesStore } from '../../../../store';
import { FONT, inputStyle } from './primitives';

export const VariableLinker = memo(function VariableLinker({ targetType, onSelect, tooltip }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pickerVar, setPickerVar] = useState(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [checkedKeys, setCheckedKeys] = useState(new Set());
  const { variables } = useVariablesStore();
  const containerRef = useRef(null);
  
  const relevantVars = useMemo(() => {
    return variables.filter(v => Array.isArray(targetType) ? targetType.includes(v.var_type) : v.var_type === targetType);
  }, [variables, targetType]);

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

  const handleVarClick = useCallback((v) => {
    const isStringArray = Array.isArray(v.value) && v.value.length > 1 && typeof v.value[0] === 'string';
    if (isStringArray) {
      setPickerVar(v);
      setPickerSearch('');
      setCheckedKeys(new Set());
      setIsOpen(false);
    } else {
      onSelect(v);
      setIsOpen(false);
    }
  }, [onSelect]);

  const toggleKey = useCallback((key) => {
    setCheckedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  const handleAddSelected = useCallback(() => {
    if (checkedKeys.size === 0) return;
    onSelect({ ...pickerVar, value: Array.from(checkedKeys) });
    setPickerVar(null);
    setPickerSearch('');
    setCheckedKeys(new Set());
  }, [checkedKeys, pickerVar, onSelect]);

  const filteredKeys = useMemo(() => {
    return pickerVar
      ? pickerVar.value.filter(k => String(k).toLowerCase().includes(pickerSearch.toLowerCase()))
      : [];
  }, [pickerVar, pickerSearch]);

  const handleSelectAll = useCallback(() => {
    if (checkedKeys.size === filteredKeys.length) {
      setCheckedKeys(prev => {
        const next = new Set(prev);
        filteredKeys.forEach(k => next.delete(k));
        return next;
      });
    } else {
      setCheckedKeys(prev => {
        const next = new Set(prev);
        filteredKeys.forEach(k => next.add(k));
        return next;
      });
    }
  }, [checkedKeys, filteredKeys]);
  
  return (
    <div className="relative inline-block" ref={containerRef}>
      <button 
        type="button"
        title={tooltip || "Link to variable"}
        onClick={(e) => { e.preventDefault(); setIsOpen(!isOpen); setPickerVar(null); }}
        className="bg-transparent border-none p-1 cursor-pointer text-[var(--accent-btn,#3b82f6)] flex items-center"
      >
        <FiZap size={14} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full right-0 z-[100] bg-white border border-[var(--border)] rounded-lg shadow-md min-w-[200px] p-2 mt-1">
          <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1.5 px-1">
            Variables ({Array.isArray(targetType) ? targetType.join(', ') : targetType})
          </div>
          {relevantVars.length === 0 ? (
            <div className="text-[11px] text-[var(--text-muted)] p-1 italic">No variables found</div>
          ) : (
            <div className="max-h-[150px] overflow-y-auto">
              {relevantVars.map(v => (
                <div 
                  key={v.key}
                  onClick={() => handleVarClick(v)}
                  className="p-1.5 text-xs cursor-pointer rounded font-mono flex justify-between items-center hover:bg-[var(--bg-hover)]"
                >
                  <span>{v.key}</span>
                  {Array.isArray(v.value) && v.value.length > 1 && (
                    <span className="text-[9px] text-slate-400 font-semibold">{v.value.length} items</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {pickerVar && (
        <div 
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10001] bg-white rounded-2xl shadow-2xl w-[640px] max-w-[90vw] max-h-[70vh] flex flex-col overflow-hidden border border-[var(--border,#e2e8f0)]"
          style={{ fontFamily: FONT }}
        >
          <div className="px-5 py-4 border-b border-[var(--border,#e2e8f0)] flex justify-between items-center bg-[#FAFBFC]">
            <div>
              <div className="text-sm font-bold text-[var(--text-primary,#1e293b)]">
                Select Keys from <code className="bg-[#EEF2FF] px-1.5 py-0.5 rounded text-xs text-[#4338CA]">{pickerVar.key}</code>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {checkedKeys.size} of {pickerVar.value.length} selected
              </div>
            </div>
            <button 
              onClick={() => { setPickerVar(null); setPickerSearch(''); setCheckedKeys(new Set()); }}
              className="bg-transparent border-none cursor-pointer text-slate-400 p-1"
            >
              <FiX size={18} />
            </button>
          </div>

          <div className="px-5 py-3 border-b border-slate-100 flex gap-2 items-center">
            <div className="relative flex-1">
              <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                value={pickerSearch}
                onChange={e => setPickerSearch(e.target.value)}
                placeholder={`Search ${pickerVar.value.length} keys...`}
                autoFocus
                className="w-full pl-8 pr-2.5 py-2 rounded-lg border border-[var(--border,#e2e8f0)] outline-none text-xs text-[var(--text-primary)] bg-white box-border"
              />
            </div>
            <button
              onClick={handleSelectAll}
              className="border border-[var(--border,#e2e8f0)] bg-white px-3 py-1.5 rounded-lg cursor-pointer text-[11px] font-semibold text-slate-500 whitespace-nowrap"
            >
              {checkedKeys.size === filteredKeys.length && filteredKeys.length > 0 ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-1">
            {filteredKeys.map((key) => {
              const isChecked = checkedKeys.has(key);
              return (
                <label
                  key={key}
                  className={`flex items-center gap-2.5 p-1.5 rounded-md cursor-pointer text-xs font-mono transition-colors duration-100 border-b border-slate-50 hover:bg-slate-50 ${isChecked ? 'text-slate-800 bg-[#EEF2FF]' : 'text-slate-500 bg-transparent'}`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleKey(key)}
                    className="w-4 h-4 cursor-pointer accent-[#6366f1] shrink-0"
                  />
                  <span className="overflow-x-auto whitespace-nowrap flex-1 pb-0.5 scrollbar-thin">
                    {key}
                  </span>
                </label>
              );
            })}
            {filteredKeys.length === 0 && (
              <div className="p-5 text-center text-slate-400 text-xs">
                No keys match "{pickerSearch}"
              </div>
            )}
          </div>

          <div className="px-5 py-3 border-t border-[var(--border,#e2e8f0)] flex justify-between items-center bg-[#FAFBFC]">
            <span className="text-[11px] text-slate-400">
              {checkedKeys.size > 0 ? `${checkedKeys.size} key${checkedKeys.size > 1 ? 's' : ''} selected` : 'Check the keys you need'}
            </span>
            <button
              onClick={handleAddSelected}
              disabled={checkedKeys.size === 0}
              className={`border-none px-5 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all duration-200 ${checkedKeys.size > 0 ? 'bg-[var(--theme-primary,#6366f1)] text-white cursor-pointer' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
            >
              <FiCheck size={14} /> Add Selected
            </button>
          </div>
        </div>
      )}

      {pickerVar && (
        <div 
          className="fixed inset-0 z-[10000] bg-black/20 backdrop-blur-[2px]"
          onClick={() => { setPickerVar(null); setPickerSearch(''); setCheckedKeys(new Set()); }}
        />
      )}
    </div>
  );
});

export const VariableDropdown = memo(function VariableDropdown({ value, onChange, placeholder, style, id }) {
  const { variables } = useVariablesStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  
  const targetClasses = useMemo(() => {
    return variables
      .filter(v => v.var_type === 'schema_list' || v.var_type === 'list')
      .flatMap(v => v.var_type === 'list' ? v.value : v.value.map(i => i.name));
  }, [variables]);
    
  const uniqueClasses = useMemo(() => [...new Set(targetClasses)], [targetClasses]);

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

  const filtered = useMemo(() => {
    return uniqueClasses.filter(c => c.toLowerCase().includes((value || '').toLowerCase()));
  }, [uniqueClasses, value]);

  return (
    <div ref={containerRef} className="relative" style={{ width: style?.width || '100%', minWidth: style?.minWidth }}>
      <div className="relative flex items-center">
        <input 
          value={value ?? ''}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pr-7 pl-3 py-2 bg-white border border-[var(--border)] rounded-lg text-[13px] outline-none text-[var(--text-primary)] transition-colors duration-150 box-border focus:border-[var(--accent-btn)]"
          style={{ ...style, fontFamily: FONT }}
        />
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer flex items-center justify-center text-[var(--text-muted)]"
        >
          <FiChevronDown className="transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }} />
        </div>
      </div>
      
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-[var(--border)] rounded-lg shadow-xl z-[10000] max-h-[250px] overflow-y-auto p-1">
          {uniqueClasses.length === 0 && (
            <div className="p-2 text-xs text-[var(--text-muted)] text-center">
              No classes found in variables
            </div>
          )}
          {filtered.map(c => (
            <div 
              key={c}
              onClick={() => { onChange(c); setIsOpen(false); }}
              className={`p-2 cursor-pointer text-xs rounded transition-colors duration-150 ${value === c ? 'bg-[#F0F4FF] text-[var(--accent-btn)] font-semibold' : 'text-[var(--text-primary)] hover:bg-slate-50'}`}
            >
              {c}
            </div>
          ))}
          {filtered.length === 0 && uniqueClasses.length > 0 && (
             <div className="p-2 text-xs text-[var(--text-muted)] italic">
               Press Enter to use custom value
             </div>
          )}
        </div>
      )}
    </div>
  );
});
