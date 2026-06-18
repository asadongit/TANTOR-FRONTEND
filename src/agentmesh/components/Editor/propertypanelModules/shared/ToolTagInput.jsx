import React, { useState, useEffect, useRef, memo } from 'react';
import { FiPlus, FiX, FiSearch, FiSettings, FiTool } from 'react-icons/fi';
import { ToolConfigModal } from './ToolConfigModal';
import { FONT } from './primitives';

export const ToolTagInput = memo(function ToolTagInput({ value = [], configs = {}, onUpdate, availableTools = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [configTool, setConfigTool] = useState(null);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

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
    let uniqueName = tName;
    if (value.includes(tName)) {
      let suffix = 1;
      while (value.includes(`${tName}::${suffix}`)) {
        suffix++;
      }
      uniqueName = `${tName}::${suffix}`;
    }

    const nextTools = [...value, uniqueName];
    const nextConfigs = { ...configs };

    const baseName = tName.toLowerCase();
    if (baseName.includes('rag') || baseName.includes('memory')) {
      nextConfigs[uniqueName] = {
        collection_name: 'default',
        k: 5,
        threshold: 0.5,
        vector_store_type: 'chroma'
      };
    } else {
      nextConfigs[uniqueName] = {};
    }

    if (uniqueName !== tName) {
      const baseAlias = tName.replace(/[^a-zA-Z0-9_]/g, '_');
      const suffix = uniqueName.split('::')[1];
      nextConfigs[uniqueName].alias_override = `${baseAlias}_${suffix}`;
    }

    onUpdate(nextTools, nextConfigs);
    setIsOpen(false);
    setSearchTerm('');
  };

  const remove = (tName) => {
    const nextTools = value.filter((x) => x !== tName);
    const nextConfigs = { ...configs };
    delete nextConfigs[tName];
    onUpdate(nextTools, nextConfigs);
  };

  const filteredTools = availableTools.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.display_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.category && t.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex flex-wrap gap-1.5 mb-2.5 min-h-[46px] pr-10 pl-2 py-2 border border-[var(--border)] rounded-xl bg-[var(--bg-canvas)] relative">
        {value.length === 0 && <span className="text-[var(--text-muted)] text-xs p-1.5">No tools assigned</span>}
        {value.map((t) => {
          const toolInfo = availableTools.find(at => at.name === t.split('::')[0]);
          const description = toolInfo?.description || "No description available";
          const alias = configs[t]?.alias_override;
          const displayLabel = alias ? `${t} (${alias})` : t;

          return (
            <span
              key={t}
              title={description}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[var(--border)] rounded-full text-[11px] text-[var(--text-primary)] font-semibold shadow-sm cursor-help"
            >
              {displayLabel}
              <button
                onClick={(e) => { e.stopPropagation(); setConfigTool(t); }}
                className="bg-transparent border-none text-[#4285F4] cursor-pointer flex items-center p-0"
                title="Configure parameters"
              >
                <FiSettings size={12} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); remove(t); }} className="bg-transparent border-none text-[var(--text-muted)] cursor-pointer text-sm leading-none p-0 ml-0.5">&times;</button>
            </span>
          );
        })}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`absolute top-2 right-2 w-6.5 h-6.5 rounded-lg border border-[var(--border)] bg-white flex items-center justify-center cursor-pointer shadow-sm transition-all duration-200 z-[5] hover:border-[var(--accent-btn)] hover:text-[var(--accent-btn)] ${isOpen ? 'text-[var(--accent-btn)]' : 'text-slate-500'}`}
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
        <div className="absolute top-[calc(100%-6px)] left-0 right-0 z-[110] bg-white border border-[var(--border)] rounded-xl shadow-2xl mt-1 overflow-hidden">
          <div className="p-2.5 border-b border-[var(--border-light)] bg-[#F8FAFC]">
            <div className="relative">
              <FiSearch size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                ref={searchInputRef}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tools by name or description..."
                className="w-full pl-8 pr-2.5 py-2 rounded-lg border border-[var(--border)] text-xs outline-none bg-white"
                style={{ fontFamily: FONT }}
              />
            </div>
          </div>

          <div className="max-h-[220px] overflow-y-auto p-1">
            {filteredTools.length === 0 ? (
              <div className="p-6 text-xs text-[var(--text-muted)] text-center">
                <FiTool size={20} className="block mx-auto mb-2 opacity-30" />
                {searchTerm ? `No tools matching "${searchTerm}"` : (availableTools.length === 0 ? 'No tools registered. Go to Tools page to add some.' : 'All tools already added.')}
              </div>
            ) : (
              filteredTools.map(t => (
                <div
                  key={t.name}
                  onClick={() => add(t.name)}
                  className="p-2.5 px-3.5 rounded-lg cursor-pointer transition-all duration-150 m-0.5 flex flex-col hover:bg-[#F0F4FF] hover:translate-x-1"
                >
                  <div className="text-xs font-semibold text-[var(--text-primary)]">{t.display_name || t.name}</div>
                  {t.description && <div className="text-[10px] text-[var(--text-muted)] mt-0.5 line-clamp-1">{t.description}</div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
});
