import React, { useState, useRef, useEffect } from 'react';
import { Field, Select, Slider } from './SharedComponents';
import { FiChevronDown, FiCheck } from 'react-icons/fi';

const AVAILABLE_EXTENSIONS = [
  { id: 'pdf', label: 'PDF Documents (.pdf)' },
  { id: 'png', label: 'PNG Images (.png)' },
  { id: 'jpg', label: 'JPG / JPEG Images (.jpg, .jpeg)' },
  { id: 'webp', label: 'WEBP Images (.webp)' },
  { id: 'json', label: 'JSON Data (.json)' },
  { id: 'html', label: 'Web Page (.html, .htm)' },
  { id: 'txt', label: 'Text Files (.txt, .md)' },
  { id: 'csv', label: 'CSV / Excel (.csv, .xlsx)' },
];

const STRATEGY_CATALOG = {
  pdf: {
    label: 'PDF Document',
    defaultStrategy: 'page_by_page',
    options: [
      { label: 'Page-by-Page Split (Default)', value: 'page_by_page' },
      { label: 'Whole PDF Document', value: 'whole_file' },
    ]
  },
  images: {
    label: 'Image (PNG / JPG / WEBP)',
    defaultStrategy: 'original',
    options: [
      { label: 'Original Color Image (Default)', value: 'original' },
      { label: 'Black & White (Grayscale/Threshold)', value: 'black_white' },
    ]
  },
  json: {
    label: 'JSON Data',
    defaultStrategy: 'raw_json',
    options: [
      { label: 'Raw Object (Default)', value: 'raw_json' },
      { label: 'Flatten Keys', value: 'flatten' },
    ]
  },
  webpage: {
    label: 'Web Page / HTML',
    defaultStrategy: 'html_raw',
    options: [
      { label: 'Extract HTML (Default)', value: 'html_raw' },
      { label: 'Scrape Text', value: 'scrape_text' },
    ]
  }
};

function MultiSelectDropdown({ allowedExts, onToggle }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCount = AVAILABLE_EXTENSIONS.filter((item) =>
    item.id === 'jpg'
      ? (allowedExts.includes('jpg') || allowedExts.includes('jpeg'))
      : allowedExts.includes(item.id)
  ).length;

  return (
    <div ref={dropdownRef} className="relative w-full">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-xs bg-[var(--bg-secondary,#FFFFFF)] cursor-pointer flex items-center justify-between shadow-sm hover:border-[var(--accent-btn,#4F46E5)] transition-colors"
      >
        <span className="font-medium text-[var(--text-primary,#1E293B)]">
          {selectedCount > 0
            ? `${selectedCount} format(s) selected`
            : 'Select Allowed Formats...'}
        </span>
        <FiChevronDown size={14} className={`text-[var(--text-muted,#94A3B8)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-[var(--bg-card-neutral,#FFFFFF)] border border-[var(--border)] rounded-xl shadow-xl z-50 p-2 max-h-56 overflow-y-auto flex flex-col gap-1">
          {AVAILABLE_EXTENSIONS.map((item) => {
            const isChecked = item.id === 'jpg'
              ? (allowedExts.includes('jpg') || allowedExts.includes('jpeg'))
              : allowedExts.includes(item.id);

            return (
              <div
                key={item.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggle(item.id);
                }}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[var(--bg-hover,#F1F5F9)] cursor-pointer text-xs font-medium text-[var(--text-primary,#1E293B)] transition-colors select-none"
              >
                <div className="flex items-center gap-2 pointer-events-none">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span>{item.label}</span>
                </div>
                {isChecked && <FiCheck size={14} className="text-indigo-600 pointer-events-none" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MultiFileIngestionConfig({ data, update, nodes, selectedNodeId }) {
  const allowedExts = Array.isArray(data.allowed_extensions) ? data.allowed_extensions : ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
  const maxMb = data.max_file_size_mb ?? 25.0;
  const maxFiles = data.max_files_count ?? 10;
  const [isStrategiesOpen, setIsStrategiesOpen] = useState(false);

  // Dynamic Strategy Group Rules Array (Supports 0 rules up to N rules)
  const strategyRules = data.strategy_rules || [];

  const toggleExtension = (extId) => {
    let nextExts = [...allowedExts];
    if (extId === 'jpg') {
      if (nextExts.includes('jpg') || nextExts.includes('jpeg')) {
        nextExts = nextExts.filter(e => e !== 'jpg' && e !== 'jpeg');
      } else {
        nextExts.push('jpg', 'jpeg');
      }
    } else if (nextExts.includes(extId)) {
      nextExts = nextExts.filter(e => e !== extId);
    } else {
      nextExts.push(extId);
    }
    update({ allowed_extensions: nextExts });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Allowed File Formats - Multi-Checkbox Dropdown */}
      <Field label="Allowed File Formats" hint="Click dropdown to check permitted file formats">
        <MultiSelectDropdown allowedExts={allowedExts} onToggle={toggleExtension} />
      </Field>

      {/* Maximum File Size Limit Slider */}
      <Field label={`Max Size Limit per File (${maxMb} MB)`} hint="Set max file size limit (1 MB to 100 MB)">
        <Slider
          value={maxMb}
          min={1}
          max={100}
          step={1}
          unit=" MB"
          onChange={(val) => update({ max_file_size_mb: val })}
        />
      </Field>

      {/* Max Batch Files Count Slider */}
      <Field label={`Max Batch Files Count (${maxFiles} files)`} hint="Set maximum files allowed per batch (1 to 50 files)">
        <Slider
          value={maxFiles}
          min={1}
          max={50}
          step={1}
          unit=" files"
          onChange={(val) => update({ max_files_count: val })}
        />
      </Field>

      {/* Collapsible Accordion: File Processing Strategies */}
      <div className="border border-[var(--border)] rounded-xl bg-[var(--bg-card-neutral,#FFFFFF)] overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setIsStrategiesOpen(!isStrategiesOpen)}
          className="w-full px-3.5 py-2.5 flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/80 transition-colors text-left border-none cursor-pointer"
        >
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[var(--text-primary,#1E293B)]">File Processing Strategies</span>
            <span className="text-[10px] text-[var(--text-muted,#94A3B8)] font-medium">Configure format specific parsing rules</span>
          </div>
          <FiChevronDown size={16} className={`text-[var(--text-muted,#94A3B8)] transition-transform duration-200 ${isStrategiesOpen ? 'rotate-180' : ''}`} />
        </button>

        {isStrategiesOpen && (
          <div className="p-3 border-t border-[var(--border)] flex flex-col gap-3">
            {Object.entries(STRATEGY_CATALOG).map(([fileType, catalog]) => {
              // Find existing rule or use standard defaults
              const existingRule = strategyRules.find(r => r.file_type === fileType);
              const currentStrategy = existingRule?.strategy || catalog.defaultStrategy;

              const handleStrategyChange = (newVal) => {
                let updatedRules = [...strategyRules];
                const existingIdx = updatedRules.findIndex(r => r.file_type === fileType);

                if (existingIdx >= 0) {
                  updatedRules[existingIdx] = { ...updatedRules[existingIdx], strategy: newVal };
                } else {
                  updatedRules.push({
                    id: `rule_${fileType}_${Date.now()}`,
                    file_type: fileType,
                    strategy: newVal
                  });
                }
                update({ strategy_rules: updatedRules });
              };

              return (
                <div
                  key={fileType}
                  className="p-3 bg-white rounded-xl border border-[var(--border)] flex flex-col gap-2 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-primary,#1E293B)]">
                      {catalog.label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {existingRule ? 'Custom' : 'Default'}
                    </span>
                  </div>

                  <Select
                    value={currentStrategy}
                    onChange={handleStrategyChange}
                    options={catalog.options}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
