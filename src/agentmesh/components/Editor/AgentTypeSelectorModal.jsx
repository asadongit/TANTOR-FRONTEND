import React from 'react';
import PropTypes from 'prop-types';

export default function AgentTypeSelectorModal({ isOpen, onClose, onSelect }) {
  if (!isOpen) return null;

  const agentTypes = [
    { 
      id: 'llm_agent', 
      label: 'Standard Agent', 
      desc: 'LLM node with tools.', 
      hoverBorder: 'hover:border-blue-500', 
      hoverBg: 'hover:bg-blue-50/30' 
    },
    { 
      id: 'deep_agent', 
      label: 'Deep Agent', 
      desc: 'Postgres memory agent.', 
      hoverBorder: 'hover:border-violet-500', 
      hoverBg: 'hover:bg-violet-50/30' 
    },
    { 
      id: 'supervisor', 
      label: 'Supervisor', 
      desc: 'Orchestrates workers.', 
      hoverBorder: 'hover:border-emerald-500', 
      hoverBg: 'hover:bg-emerald-50/30' 
    },
    { 
      id: 'swarm', 
      label: 'Swarm Agent', 
      desc: 'Multi-agent network.', 
      hoverBorder: 'hover:border-pink-500', 
      hoverBg: 'hover:bg-pink-50/30' 
    },
  ];

  return (
    <div 
      className="fixed inset-0 z-[11000] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-5 animate-fade-in"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      role="button"
      tabIndex={0}
    >
      <div 
        className="w-full max-w-[450px] bg-white rounded-[20px] shadow-xl p-6 cursor-default"
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <div className="text-center mb-5">
          <h3 className="text-base font-extrabold text-slate-900 mb-1">Select Node Type</h3>
          <p className="text-xs text-slate-500">Choose how you want to deploy this agent on the canvas.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {agentTypes.map(t => (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl border border-slate-100 bg-white cursor-pointer transition-all duration-200 text-center ${t.hoverBorder} ${t.hoverBg}`}
            >
              <div className="text-[13px] font-extrabold text-slate-900">{t.label}</div>
              <div className="text-[10px] text-slate-500 leading-tight">{t.desc}</div>
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full py-2.5 px-4 rounded-lg border-0 bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-bold cursor-pointer transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

AgentTypeSelectorModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
};
