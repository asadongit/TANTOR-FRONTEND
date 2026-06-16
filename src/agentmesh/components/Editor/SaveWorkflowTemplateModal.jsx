import React, { useState } from 'react';
import { FiX, FiSave, FiTag, FiLayers, FiFileText, FiEye, FiEyeOff, FiUsers, FiGlobe } from 'react-icons/fi';
import { saveWorkflowTemplate } from '../../api/agentmesh';
import ConfirmationModal from '../Common/ConfirmationModal';

const FONT = "'Google Sans','Roboto',sans-serif";

const inputStyle = {
  width: '100%', padding: '10px 12px', background: 'white',
  border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)',
  fontSize: 13, outline: 'none', fontFamily: FONT, transition: 'border-color 0.15s',
  boxSizing: 'border-box',
};

const CATEGORIES = [
  "Automation", "Infrastructure", "RAG & Knowledge", "Customer Support", "Marketing & Sales",
  "Data & Analytics", "DevOps & Technical", "Content & Creative", "HR & Finance",
  "Legal & Compliance", "Research & Development", "Project Management", "Personal Assistant",
  "Translation & Lang", "Other"
].sort();

function SearchableSelect({ value, onChange, options }) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef(null);

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  React.useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ ...inputStyle, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <span>{value || "Select Category..."}</span>
        <span style={{ fontSize: 10, opacity: 0.5 }}>▼</span>
      </div>

      {isOpen && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "white", border: "1px solid var(--border)", borderRadius: 10,
          boxShadow: "var(--shadow-xl)", zIndex: 100, padding: 8, maxHeight: 200, overflowY: "auto"
        }}>
          <input
            style={{ ...inputStyle, marginBottom: 8, height: 32, fontSize: 12, padding: "4px 10px" }}
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {filtered.map(opt => (
              <div
                key={opt}
                onClick={() => { onChange(opt); setIsOpen(false); setSearch(""); }}
                style={{
                  padding: "8px 12px", borderRadius: 6, fontSize: 13, cursor: "pointer",
                  background: value === opt ? "var(--accent-glow)" : "transparent",
                  color: value === opt ? "var(--accent-btn)" : "var(--text-primary)",
                  fontWeight: value === opt ? 600 : 400
                }}
                onMouseEnter={(e) => { if (value !== opt) e.currentTarget.style.background = "#F1F5F9"; }}
                onMouseLeave={(e) => { if (value !== opt) e.currentTarget.style.background = "transparent"; }}
              >
                {opt}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, icon: Icon, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
        {Icon && <Icon size={12} />}
        {label}
      </label>
      {children}
    </div>
  );
}

export default function SaveWorkflowTemplateModal({ workflowConfig, onClose, onSaved }) {
  const [name, setName] = useState(workflowConfig.name || '');
  const [description, setDescription] = useState(workflowConfig.description || '');
  const [group, setGroup] = useState(workflowConfig.group || 'Default');
  const [category, setCategory] = useState(workflowConfig.category || 'Automation');
  const [scope, setScope] = useState('private'); // 'private', 'member', 'public'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [successAlert, setSuccessAlert] = useState(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a template name');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await saveWorkflowTemplate({
        name,
        description,
        group,
        category,
        config: workflowConfig,
        scope
      });
      setSuccessAlert({
        title: "Template Saved",
        message: "Workflow saved as Template successfully!"
      });
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const scopeOptions = [
    { value: 'private', label: 'Private', desc: 'Only you can see and use this template', icon: FiEyeOff, color: '#EF4444' },
    { value: 'member', label: 'Member', desc: 'Only team members can see and use this template', icon: FiUsers, color: '#3B82F6' },
    { value: 'public', label: 'Public', desc: 'Anyone can view and clone this template', icon: FiGlobe, color: '#10B981' }
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        width: 550, background: 'white', borderRadius: 20,
        boxShadow: 'var(--shadow-2xl)', border: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', fontFamily: FONT
      }}>
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC',
          borderTopLeftRadius: 20, borderTopRightRadius: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--theme-primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-primary)' }}>
              <FiSave size={18} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Save Workflow as Template
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
            <FiX size={20} />
          </button>
        </div>

        <div style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
          {error && (
            <div style={{ marginBottom: 16, padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#DC2626', fontSize: 12 }}>
              {error}
            </div>
          )}

          <Field label="Template Name" icon={FiTag}>
            <input
              style={inputStyle}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sales Pipeline Workflow"
              autoFocus
            />
          </Field>

          <Field label="Description" icon={FiFileText}>
            <textarea
              style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this workflow specializes in..."
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Group" icon={FiLayers}>
              <input
                style={inputStyle}
                value={group}
                onChange={(e) => {
                  const validatedVal = e.target.value.toLowerCase().replace(/ /g, '_').replace(/[^a-z_]/g, '');
                  setGroup(validatedVal);
                }}
                placeholder="Default"
              />
            </Field>
            <Field label="Category" icon={FiTag}>
              <SearchableSelect
                value={category}
                onChange={setCategory}
                options={CATEGORIES}
              />
            </Field>
          </div>

          <Field label="Visibility Scope" icon={FiEye}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {scopeOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = scope === opt.value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => setScope(opt.value)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                      borderRadius: 12, border: `1px solid ${isSelected ? 'var(--theme-primary)' : 'var(--border)'}`,
                      background: isSelected ? 'var(--theme-primary-glow)' : 'white',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, background: isSelected ? 'white' : '#F1F5F9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: opt.color,
                      border: `1px solid ${isSelected ? 'rgba(124, 58, 237, 0.1)' : 'transparent'}`
                    }}>
                      <Icon size={16} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{opt.label}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{opt.desc}</span>
                    </div>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', border: `2px solid ${isSelected ? 'var(--theme-primary)' : '#CBD5E1'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      {isSelected && (
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--theme-primary)' }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Field>
        </div>

        <div style={{ 
          padding: '16px 24px', background: '#F8FAFC', borderTop: '1px solid var(--border)', 
          display: 'flex', justifyContent: 'flex-end', gap: 12,
          borderBottomLeftRadius: 20, borderBottomRightRadius: 20 
        }}>
          <button
            onClick={onClose}
            style={{ padding: '10px 18px', background: 'white', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!name.trim()) {
                setError('Please enter a template name');
                return;
              }
              setShowConfirm(true);
            }}
            disabled={loading}
            style={{
              padding: '10px 22px', background: 'var(--theme-primary)', color: 'white', 
              border: 'none', borderRadius: 10,
              fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.15)',
              opacity: loading ? 0.7 : 1, transition: 'all 0.2s', fontFamily: FONT
            }}
            onMouseEnter={e => { if(!loading) e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={e => { if(!loading) e.currentTarget.style.opacity = '1'; }}
          >
            {loading ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSave}
        title="Save Template"
        message={`Are you sure you want to save this workflow as a template named **${name}**?`}
        confirmText="Save"
        variant="success"
      />

      <ConfirmationModal
        isOpen={!!successAlert}
        onClose={() => {
          setSuccessAlert(null);
          onSaved();
          onClose();
        }}
        onConfirm={async () => {
          setSuccessAlert(null);
          onSaved();
          onClose();
        }}
        title={successAlert?.title || "Success"}
        message={successAlert?.message || ""}
        confirmText="OK"
        cancelText={null}
        variant="success"
      />
    </div>
  );
}
