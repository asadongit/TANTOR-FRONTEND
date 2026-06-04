import React, { useState } from 'react';
import { FiX, FiSave, FiTag, FiLayers, FiFileText } from 'react-icons/fi';
import { saveAgentTemplate, saveComponentTemplate, listCategories, createCategory } from '../../api/agentmesh';
import { PREDEFINED_API_CATEGORIES } from '../../constants/apiCategories';

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
  "Legal & Compliance", "Healthcare & Med", "Education & Learning", "E-commerce & Retail",
  "Real Estate & Prop", "Logistics & Supply", "Cybersecurity & Risk", "Research & Development",
  "Social Media Mgmt", "SEO & Web", "Project Management", "Personal Assistant",
  "Translation & Lang", "Video & Audio Edit", "Game Development", "IoT & Hardware",
  "Blockchain & Crypto", "Travel & Hospitality", "Agriculture & AgriTech", "Manufacturing & Ind",
  "Energy & Utilities", "Non-Profit & NGO", "Government & Public", "Personal Finance",
  "Fitness & Wellness", "Mental Health", "Entertainment & Fun", "News & Journalism",
  "Scientific Computing", "UX/UI & Product Design", "Testing & QA", "Recruitment & Talent",
  "Event Planning", "Customer Retention", "Fraud Detection", "Inventory Management",
  "Technical Writing", "Community Management", "E-mail Automation", "Lead Generation",
  "Prompt Engineering", "Agent Orchestration", "Other"
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
          boxShadow: "var(--shadow-xl)", zIndex: 100, padding: 8, maxHeight: 240, overflowY: "auto"
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
            {filtered.length === 0 && (
              <div style={{ padding: "8px", textAlign: "center", color: "#94A3B8", fontSize: 12 }}>No categories found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ApiCategorySelect({ value, onChange, options }) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef(null);

  // Allow filtering by name or description
  const filtered = options.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase()) || 
    (o.description && o.description.toLowerCase().includes(search.toLowerCase()))
  );
  
  // Check if exact match exists to determine if we should show "+ Create"
  const exactMatchExists = options.some(o => o.name.toLowerCase() === search.toLowerCase());
  const showCreateOption = search.trim() !== "" && !exactMatchExists;

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
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {value || "Select API Category..."}
        </span>
        <span style={{ fontSize: 10, opacity: 0.5, flexShrink: 0 }}>▼</span>
      </div>

      {isOpen && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "white", border: "1px solid var(--border)", borderRadius: 10,
          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)", 
          zIndex: 100, padding: 8, maxHeight: 280, overflowY: "auto",
          display: 'flex', flexDirection: 'column'
        }}>
          <input
            style={{ ...inputStyle, marginBottom: 8, height: 34, fontSize: 12, padding: "6px 10px", flexShrink: 0 }}
            placeholder="Search or type custom category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
            {filtered.map(opt => (
              <div
                key={opt.name}
                onClick={() => { onChange(opt.name); setIsOpen(false); setSearch(""); }}
                style={{
                  padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                  background: value === opt.name ? "var(--theme-primary-glow)" : "transparent",
                  border: value === opt.name ? "1px solid rgba(124, 58, 237, 0.2)" : "1px solid transparent",
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => { if (value !== opt.name) { e.currentTarget.style.background = "#F8FAFC"; e.currentTarget.style.borderColor = "#F1F5F9"; } }}
                onMouseLeave={(e) => { if (value !== opt.name) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; } }}
              >
                <div style={{ fontSize: 13, fontWeight: value === opt.name ? 700 : 600, color: value === opt.name ? "var(--theme-primary)" : "var(--text-primary)" }}>
                  {opt.name}
                </div>
                {opt.description && (
                  <div style={{ fontSize: 11, color: value === opt.name ? "var(--theme-primary)" : "#64748B", marginTop: 4, lineHeight: 1.4, opacity: 0.9 }}>
                    {opt.description}
                  </div>
                )}
              </div>
            ))}
            
            {showCreateOption && (
              <div
                onClick={() => { onChange(search); setIsOpen(false); setSearch(""); }}
                style={{
                  padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                  background: "#F0FDF4", border: "1px dashed #86EFAC",
                  marginTop: 4, display: 'flex', alignItems: 'center', gap: 8
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#DCFCE7"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#F0FDF4"; }}
              >
                <span style={{ color: "#16A34A", fontSize: 14, fontWeight: 800 }}>+</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#16A34A" }}>Create "{search}"</div>
                  <div style={{ fontSize: 11, color: "#15803D", marginTop: 2 }}>Select to add as a new custom category</div>
                </div>
              </div>
            )}
            
            {filtered.length === 0 && !showCreateOption && (
              <div style={{ padding: "16px", textAlign: "center", color: "#94A3B8", fontSize: 12 }}>
                Start typing to create a category
              </div>
            )}
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

export default function SaveTemplateModal({ agentConfig, onClose, onSaved }) {
  const isApiNode = agentConfig.type === 'api_node';
  const [name, setName] = useState(agentConfig.label || '');
  const [description, setDescription] = useState('');
  const [group, setGroup] = useState('Default');
  const [category, setCategory] = useState(isApiNode ? 'Core Banking & CRM' : 'Automation');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dbCategories, setDbCategories] = useState([]);

  React.useEffect(() => {
    if (isApiNode) {
      listCategories('api_node').then(res => setDbCategories(res.categories || [])).catch(() => {});
    }
  }, [isApiNode]);

  // Merge predefined with DB for APIs
  const apiCategoryOptions = React.useMemo(() => {
    const map = new Map();
    PREDEFINED_API_CATEGORIES.forEach(c => map.set(c.name, c));
    dbCategories.forEach(c => {
      if (!map.has(c.name)) map.set(c.name, { name: c.name, description: c.description });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [dbCategories]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a template name');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (isApiNode) {
        // Handle custom category creation if it doesn't exist
        let finalCatName = category;
        const exists = apiCategoryOptions.find(c => c.name === category);
        if (!exists) {
            // It's a new custom category. Create it.
            await createCategory({ name: category, description: newCategoryDesc, type: 'api_node' });
        }

        // Scrub API Credentials for manual auth (keep connection_id if vault)
        const scrubbedConfig = { ...agentConfig };
        if (scrubbedConfig.api_auth_type && scrubbedConfig.api_auth_type !== 'Vault') {
             // Wipe manual passwords/tokens
             scrubbedConfig.api_auth_config = {};
        }

        await saveComponentTemplate({
          name,
          type: 'api_node',
          description,
          group,
          category_name: finalCatName,
          config: scrubbedConfig
        });
      } else {
        // Original Agent Save Logic
        const scrubbedConfig = {
          ...agentConfig,
          tool_configs: {},      
          api_auth_config: {},   
        };

        if (scrubbedConfig.llm) {
          scrubbedConfig.llm = {
            ...scrubbedConfig.llm,
            api_key_override: '' 
          };
        }

        await saveAgentTemplate({
          name,
          description,
          group,
          category,
          config: scrubbedConfig
        });
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        width: 540, background: 'white', borderRadius: 16,
        boxShadow: 'var(--shadow-2xl)', border: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC',
          borderTopLeftRadius: 16, borderTopRightRadius: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-btn)' }}>
              <FiSave size={16} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              {isApiNode ? "Save API to Library" : "Save Agent as Template"}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <FiX size={20} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
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
              placeholder="e.g. Expert Researcher Agent"
              autoFocus
            />
          </Field>

          <Field label="Description" icon={FiFileText}>
            <textarea
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`What does this ${isApiNode ? 'API' : 'agent'} specialize in?`}
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
                placeholder="e.g. Marketing"
              />
            </Field>
            <Field label="Category" icon={FiTag}>
              {isApiNode ? (
                <ApiCategorySelect
                  value={category}
                  onChange={setCategory}
                  options={apiCategoryOptions}
                />
              ) : (
                <SearchableSelect
                  value={category}
                  onChange={setCategory}
                  options={CATEGORIES}
                />
              )}
            </Field>
          </div>

          {isApiNode && category && !apiCategoryOptions.find(c => c.name === category) && (
            <div style={{ marginTop: 2, marginBottom: 16, animation: 'fadeIn 0.2s ease-out' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--theme-primary)', marginBottom: 8 }}>
                <FiFileText size={12} />
                Description for "{category}"
              </label>
              <input
                style={{ ...inputStyle, borderColor: '#DDD6FE', background: '#F5F3FF' }}
                value={newCategoryDesc}
                onChange={(e) => setNewCategoryDesc(e.target.value)}
                placeholder="Optional: What is this category for?"
              />
            </div>
          )}

          <div style={{ marginTop: 8, padding: '12px', background: '#F5F3FF', borderRadius: 10, fontSize: 11, color: '#6D28D9', lineHeight: 1.5, border: '1px solid #DDD6FE' }}>
            <strong>Security Notice:</strong> Saving this {isApiNode ? 'API' : 'agent'} will store its configuration. For your security, <strong>all {isApiNode ? 'manual auth passwords/tokens' : 'tool configurations and API keys'} are automatically scrubbed</strong> before saving to the library. {isApiNode && 'Vault Connections (connection_ids) are safely preserved.'}
          </div>
        </div>

        <div style={{ 
          padding: '16px 20px', background: '#F8FAFC', borderTop: '1px solid var(--border)', 
          display: 'flex', justifyContent: 'flex-end', gap: 12,
          borderBottomLeftRadius: 16, borderBottomRightRadius: 16 
        }}>
          <button
            onClick={onClose}
            style={{ padding: '10px 18px', background: 'white', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              padding: '10px 22px', background: 'var(--theme-primary-glow)', color: 'var(--theme-primary)', 
              border: '1px solid var(--theme-primary-glow)', borderRadius: 10,
              fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.1)',
              opacity: loading ? 0.7 : 1, transition: 'all 0.2s'
            }}
            onMouseEnter={e => { if(!loading) { e.currentTarget.style.background = 'var(--theme-primary)'; e.currentTarget.style.color = 'white'; } }}
            onMouseLeave={e => { if(!loading) { e.currentTarget.style.background = 'var(--theme-primary-glow)'; e.currentTarget.style.color = 'var(--theme-primary)'; } }}
          >
            {loading ? 'Saving...' : <><FiSave size={16} /> Save to Library</>}
          </button>
        </div>
      </div>
    </div>
  );
}
