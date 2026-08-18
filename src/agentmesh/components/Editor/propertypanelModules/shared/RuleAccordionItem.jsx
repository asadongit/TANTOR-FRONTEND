import React, { useState, memo } from 'react';
import { FiTrash2, FiChevronDown, FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { generatePythonRule } from '../../../../api/agentmesh';
import { getArchitectConfig } from '../../../../utils/architectConfig';

export const RuleAccordionItem = memo(function RuleAccordionItem({ rule, idx, totalRules, updateRule, removeRule, moveRule }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateCode = async () => {
    if (!rule.code || !rule.code.trim()) return;
    setIsGenerating(true);
    try {
      const data = await generatePythonRule(rule.code, getArchitectConfig());
      if (data.status === 'success') {
        updateRule(idx, 'code', data.code);
      } else {
        toast.error(data.message || "Failed to generate rule.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="border border-[var(--border)] rounded-lg bg-[var(--bg-card)] overflow-hidden shadow-sm mb-3">
      <div 
        className="flex items-center justify-between p-2 px-3 bg-[var(--bg-canvas)] border-b border-transparent cursor-pointer"
        style={{ borderBottomColor: isExpanded ? 'var(--border)' : 'transparent' }}
        onClick={(e) => {
          if (['INPUT', 'BUTTON', 'SVG', 'PATH', 'DIV'].includes(e.target.tagName?.toUpperCase()) && e.target.getAttribute('data-prevent-toggle')) return;
          setIsExpanded(!isExpanded);
        }}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <FiChevronDown 
            size={14} 
            className="text-[var(--text-secondary)] shrink-0 transition-transform duration-200" 
            style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }} 
          />
          <input 
            type="text" 
            value={rule.name} 
            data-prevent-toggle="true"
            onChange={(e) => updateRule(idx, 'name', e.target.value)}
            className="bg-transparent border-none outline-none text-xs font-semibold text-[var(--text-primary)] w-full min-w-[60px] ml-1"
            placeholder="Rule Name"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {/* Up/Down */}
          <div data-prevent-toggle="true" className="flex items-center gap-0.5 border-r border-[var(--border)] pr-2">
            <button data-prevent-toggle="true" onClick={(e) => { e.stopPropagation(); moveRule(idx, -1); }} disabled={idx === 0} className="bg-transparent border-none p-0 cursor-pointer disabled:opacity-30 text-[var(--text-secondary)]"><FiChevronDown data-prevent-toggle="true" className="rotate-180" size={14}/></button>
            <button data-prevent-toggle="true" onClick={(e) => { e.stopPropagation(); moveRule(idx, 1); }} disabled={idx === totalRules - 1} className="bg-transparent border-none p-0 cursor-pointer disabled:opacity-30 text-[var(--text-secondary)]"><FiChevronDown data-prevent-toggle="true" size={14}/></button>
          </div>
          {/* Toggle */}
          <div 
            onClick={(e) => { e.stopPropagation(); updateRule(idx, 'enabled', !rule.enabled); }}
            data-prevent-toggle="true"
            className="flex items-center gap-1.5 cursor-pointer"
          >
            <div data-prevent-toggle="true" className={`w-7 h-4 rounded-full relative transition-colors duration-200 ${rule.enabled ? 'bg-[var(--accent-btn)]' : 'bg-[#CBD5E1]'}`}>
              <div data-prevent-toggle="true" className="w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all duration-200 shadow" style={{ left: rule.enabled ? 14 : 2 }} />
            </div>
            <span data-prevent-toggle="true" className={`text-[11px] font-semibold ${rule.enabled ? 'text-[var(--accent-btn)]' : 'text-[var(--text-secondary)]'}`}>
              {rule.enabled ? 'Active' : 'Disabled'}
            </span>
          </div>
          {/* Delete */}
          <button data-prevent-toggle="true" onClick={(e) => { e.stopPropagation(); removeRule(idx); }} className="bg-transparent border-none text-[#DC2626] cursor-pointer p-1" title="Delete Rule">
            <FiTrash2 data-prevent-toggle="true" size={13} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3">
          <div className="flex justify-end mb-2">
            <button 
              onClick={handleGenerateCode}
              disabled={isGenerating || !rule.code || !rule.code.trim()}
              className="bg-slate-100 text-[#64748B] border border-slate-200 p-1 px-2.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-60 transition-all duration-200 hover:bg-slate-200"
            >
              {isGenerating ? <FiLoader className="animate-spin" size={12} /> : <span className="text-xs">✨</span>} 
              {isGenerating ? 'Generating...' : 'Architect'}
            </button>
          </div>

          <textarea
            value={rule.code}
            onChange={(e) => updateRule(idx, 'code', e.target.value)}
            placeholder="# e.g.\nif txn.get('amount', 0) > 1000:\n    intent = 'block'"
            rows={6}
            className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-canvas,#F8FAFC)] text-[var(--text-main)] outline-none transition-all duration-200 resize-y leading-relaxed font-mono text-xs focus:border-[#7C3AED] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)]"
          />
        </div>
      )}
    </div>
  );
});
