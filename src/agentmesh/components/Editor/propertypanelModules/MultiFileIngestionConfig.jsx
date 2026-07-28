import React, { useState, useRef, useEffect } from 'react';
import { Field, Select, Slider, HitlConfigSection, InfoBanner, AdvancedSection } from './SharedComponents';
import { FiChevronDown, FiCheck, FiPlus, FiTrash2 } from 'react-icons/fi';

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
    options: [
      { label: 'Whole PDF Document', value: 'whole_file' },
      { label: 'Page-by-Page Split', value: 'page_by_page' },
    ]
  },
  images: {
    label: 'Image (PNG / JPG / WEBP)',
    options: [
      { label: 'Original Color Image', value: 'original' },
      { label: 'Black & White (Grayscale/Threshold)', value: 'black_white' },
    ]
  },
  json: {
    label: 'JSON Data',
    options: [
      { label: 'Flatten Keys', value: 'flatten' },
      { label: 'Raw Object', value: 'raw_json' },
    ]
  },
  webpage: {
    label: 'Web Page / HTML',
    options: [
      { label: 'Scrape Text', value: 'scrape_text' },
      { label: 'Extract HTML', value: 'html_raw' },
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

  const addStrategyRule = () => {
    // Find unassigned file type or default to 'pdf'
    const assignedTypes = strategyRules.map(r => r.file_type);
    const availableTypes = ['pdf', 'images', 'json', 'webpage'].filter(t => !assignedTypes.includes(t));
    const nextType = availableTypes[0] || 'pdf';

    const newRule = {
      id: `rule_${Date.now()}`,
      file_type: nextType,
      strategy: STRATEGY_CATALOG[nextType]?.options[0]?.value || 'whole_file'
    };
    update({ strategy_rules: [...strategyRules, newRule] });
  };

  const removeStrategyRule = (ruleId) => {
    const updated = strategyRules.filter(r => r.id !== ruleId);
    update({ strategy_rules: updated });
  };

  const updateStrategyRule = (ruleId, key, val) => {
    const updated = strategyRules.map(r => {
      if (r.id === ruleId) {
        const next = { ...r, [key]: val };
        if (key === 'file_type') {
          // Reset child strategy to single valid option when parent file type changes
          next.strategy = STRATEGY_CATALOG[val]?.options[0]?.value || 'whole_file';
        }
        return next;
      }
      return r;
    });

    // Enforcement: Deduplicate rules so each parent file_type appears at most ONCE
    const uniqueMap = new Map();
    for (const rule of updated) {
      uniqueMap.set(rule.file_type, rule); // Keeps single strategy per parent file_type
    }

    update({ strategy_rules: Array.from(uniqueMap.values()) });
  };

  return (
    <div className="flex flex-col gap-4">
      <InfoBanner type="info">
        Set limits, choose allowed formats, and configure optional strategy rules. Each file format accepts exactly 1 single strategy (or 0 rules for default).
      </InfoBanner>

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

      {/* Dynamic Parent ➔ Child Strategy Rules Group matching AgentMesh Design System */}
      <Field label="Strategy Group Rules (0 or 1 Strategy per File Type)" hint="You can set 0 strategy rules (defaults apply) or add 1 single strategy per file type (e.g. PDF ➔ Whole or Page-by-Page)">
        <div className="flex flex-col gap-3 mt-1">
          {strategyRules.length === 0 ? (
            <div className="p-3 bg-[var(--bg-card-neutral,#F8FAFC)] rounded-xl border border-dashed border-[var(--border)] text-center text-xs text-[var(--text-muted)] font-medium">
              No strategy rules added (0 strategies set). System defaults will be used for all files.
            </div>
          ) : (
            strategyRules.map((rule, index) => {
              const currentCatalog = STRATEGY_CATALOG[rule.file_type] || STRATEGY_CATALOG.pdf;

              return (
                <div
                  key={rule.id || index}
                  className="p-3.5 bg-[var(--bg-card-neutral,#F8FAFC)] rounded-xl border border-[var(--border)] flex flex-col gap-2.5 relative shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-primary,#6366F1)]">
                      Rule #{index + 1}: {currentCatalog.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeStrategyRule(rule.id)}
                      className="text-[var(--text-muted)] hover:text-red-500 transition-colors p-1 border-none bg-transparent cursor-pointer"
                      title="Remove Rule"
                    >
                      <FiTrash2 size={13} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Parent Dropdown: File Type */}
                    <div>
                      <label className="text-[10px] font-semibold text-[var(--text-muted)] block mb-1">Parent File Type</label>
                      <Select
                        value={rule.file_type}
                        onChange={(val) => updateStrategyRule(rule.id, 'file_type', val)}
                        options={[
                          { label: 'PDF Document', value: 'pdf' },
                          { label: 'Image (PNG/JPG/WEBP)', value: 'images' },
                          { label: 'JSON Data', value: 'json' },
                          { label: 'Web Page / HTML', value: 'webpage' },
                        ]}
                      />
                    </div>

                    {/* Child Dropdown: Single Strategy Option */}
                    <div>
                      <label className="text-[10px] font-semibold text-[var(--text-muted)] block mb-1">Single Strategy Choice</label>
                      <Select
                        value={rule.strategy}
                        onChange={(val) => updateStrategyRule(rule.id, 'strategy', val)}
                        options={currentCatalog.options}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {strategyRules.length < 4 && (
            <button
              type="button"
              onClick={addStrategyRule}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[var(--accent-light,#EEF2FF)] hover:bg-indigo-100 text-[var(--theme-primary,#4F46E5)] rounded-xl text-xs font-semibold border border-indigo-200/80 transition-colors cursor-pointer w-full mt-1"
            >
              <FiPlus size={14} /> Add Strategy Rule
            </button>
          )}
        </div>
      </Field>

      <AdvancedSection
        hitlSection={<HitlConfigSection data={data} update={update} />}
        nodes={nodes}
        selectedNodeId={selectedNodeId}
        onErrorValue={data.on_error}
        onErrorChange={(v) => update({ on_error: v })}
      />
    </div>
  );
}
