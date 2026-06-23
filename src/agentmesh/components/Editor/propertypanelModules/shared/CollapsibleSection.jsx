import React, { useState } from 'react';
import { FiChevronDown, FiSettings } from 'react-icons/fi';
import { FONT } from './primitives';

export default function CollapsibleSection({ title, children, defaultOpen = false, icon: Icon = FiSettings }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden mb-5">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`p-3 px-4 bg-[#F8FAFC] cursor-pointer flex justify-between items-center select-none ${isOpen ? 'border-b border-[var(--border)]' : 'border-none'}`}
      >
        <div 
          className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2"
          style={{ fontFamily: FONT }}
        >
          {Icon && <Icon size={14} className="text-[var(--accent-btn)]" />}
          {title}
        </div>
        <FiChevronDown
          size={14}
          className={`text-[var(--text-muted)] transition-transform duration-200 transform ${isOpen ? 'rotate-180' : 'rotate-0'}`}
        />
      </div>

      {isOpen && (
        <div className="p-4 bg-[var(--bg-panel,white)]">
          {children}
        </div>
      )}
    </div>
  );
}
