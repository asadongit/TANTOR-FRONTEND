import React, { useState, useEffect, useRef, memo } from 'react';
import { FiChevronDown, FiSearch, FiTrash2 } from 'react-icons/fi';
import { FONT, inputStyle } from './primitives';

export const SearchableSelect = memo(function SearchableSelect({ value, onChange, options, placeholder = "Search...", disabled, showSearch = true }) {
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
    <div ref={containerRef} className="relative w-full">
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border rounded-lg text-[13px] transition-colors duration-150 box-border flex items-center justify-between disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer ${disabled ? 'bg-[#F1F5F9]' : 'bg-white'} ${isOpen ? 'border-[var(--accent-btn)]' : 'border-[var(--border)]'}`}
        style={{ fontFamily: FONT, opacity: disabled ? 0.7 : 1 }}
      >
        <span className={`overflow-hidden text-ellipsis whitespace-nowrap ${selectedOption ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <FiChevronDown size={14} className="text-[var(--text-muted)] transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }} />
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-[var(--border)] rounded-xl shadow-2xl z-[1000] overflow-hidden">
          {showSearch && (
            <div className="p-2 border-b border-[var(--border-light)] bg-[var(--bg-card-neutral,#F8FAFC)]">
              <div className="relative">
                <FiSearch size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  ref={inputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Type to filter..."
                  className="w-full pl-8 pr-2.5 py-1.5 rounded-md border border-[var(--border)] text-xs outline-none bg-white"
                />
              </div>
            </div>
          )}
          <div className="max-h-[220px] overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="p-3 text-xs text-[var(--text-muted)] text-center">No results found</div>
            ) : (
              filtered.map(o => (
                <div
                  key={o.value}
                  onClick={() => { onChange(o.value); setIsOpen(false); }}
                  className={`p-2 rounded-md cursor-pointer text-xs transition-colors duration-150 flex items-center justify-between ${value === o.value ? 'bg-[#F0F4FF] text-[var(--accent-btn)] font-semibold' : 'text-[var(--text-primary)] hover:bg-[#F0F4FF] hover:text-[var(--accent-btn)]'}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="whitespace-nowrap overflow-hidden text-ellipsis">{o.label}</div>
                    {o.sublabel && <div className="text-[10px] opacity-60 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{o.sublabel}</div>}
                  </div>
                  {o.onDelete && (
                    <div
                      onClick={(e) => { e.stopPropagation(); o.onDelete(); }}
                      className="p-1 rounded cursor-pointer text-red-500 opacity-50 hover:opacity-100 shrink-0"
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
});
