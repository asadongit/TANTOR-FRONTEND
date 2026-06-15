import React, { useEffect, useState, useRef } from 'react';
import { useWorkflowStore, useUIStore } from '../../../store';
import { listAgentTemplates, deleteAgentTemplate, getAgentTemplate } from '../../../api/agentmesh';
import {
  FiSearch, FiUser, FiInfo, FiTag, FiGrid, FiList,
  FiFilter, FiX, FiTrash2, FiCpu, FiCode, FiLayers, FiActivity,
  FiZap, FiTerminal, FiUsers, FiShield, FiTarget, FiShare2
} from 'react-icons/fi';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import bannerImage from '../../../assets/data/Stack-p-2000.png';
import Pagination from '../../Common/Pagination';
import PageHeader from '../../Common/PageHeader';

const PURPLE_THEME = {
  primary: 'var(--theme-primary)',
  bg: 'var(--bg-canvas)',
  accent: 'var(--theme-primary-glow)',
  border: 'var(--border)',
  text: 'var(--text-primary)'
};

function AgentTemplateCard({ t, onDetails, onDelete, onUse, idx }) {
  const theme = PURPLE_THEME;
  // config is NOT in the list response (summary only). Details modal fetches it on demand.

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      transition={{ duration: 0.4, delay: idx * 0.05, ease: [0.23, 1, 0.32, 1] }}
      style={{
        background: 'white',
        border: `1px solid var(--border-light)`,
        borderRadius: 24,
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        transition: 'all 0.3s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        e.currentTarget.style.borderColor = '#E2E8F0';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        e.currentTarget.style.borderColor = 'var(--border-light)';
      }}
    >
      {/* Top Body */}
      <div style={{ padding: '20px 20px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: theme.bg,
            border: `1px solid ${theme.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: theme.primary,
            boxShadow: `0 4px 12px -2px var(--theme-primary-glow)`
          }}>
            <FiUser size={22} strokeWidth={2} />
          </div>

          <div style={{
            fontSize: 9, fontWeight: 800, color: theme.primary,
            background: theme.bg, padding: '4px 10px', borderRadius: 20,
            letterSpacing: '0.05em', textTransform: 'uppercase'
          }}>
            {t.group || 'GENERAL AGENT'}
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <h3 style={{
            fontSize: 17, fontWeight: 800, color: 'var(--text-primary)',
            marginBottom: 4, letterSpacing: '-0.02em'
          }}>
            {t.name}
          </h3>
          <span style={{
            fontSize: 10, fontWeight: 800, color: theme.primary,
            background: theme.bg, padding: '2px 8px', borderRadius: 4,
            textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>
            {t.category || 'FINANCE'}
          </span>
        </div>

        <p style={{
          fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          marginBottom: 12
        }}>
          {t.description || "Deploy this agent template for complex task orchestration and real-time processing."}
        </p>
      </div>

      {/* Footer Actions */}
      <div style={{
        padding: '12px 16px',
        background: '#F9FAFB',
        borderTop: '1px solid #F1F5F9',
        display: 'flex', alignItems: 'center', gap: 10
      }}>
        <button
          onClick={(e) => { e.stopPropagation(); onUse(t); }}
          style={{
            flex: 1, height: 36, borderRadius: 8, border: 'none',
            background: theme.accent, color: theme.primary, fontSize: 11, fontWeight: 800,
            cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = theme.primary; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = theme.accent; e.currentTarget.style.color = theme.primary; }}
        >
          <span>+ Add</span>
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onDetails(t); }}
          style={{
            flex: 1, height: 36, borderRadius: 8, border: '1px solid #E5E7EB',
            background: 'white', color: '#111827', fontSize: 11, fontWeight: 700,
            cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
        >
          <FiInfo size={14} />
          <span>Details</span>
        </button>

        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
          style={{ 
            width: 36, height: 36, borderRadius: 8, border: '1px solid #FEE2E2',
            background: 'white', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
          title="Delete Template"
        >
          <FiTrash2 size={14} />
        </button>
      </div>
    </motion.div>
  );
}

function AgentDetailsModal({ template, onClose, onUse }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [fullConfig, setFullConfig] = useState(template.config || null);
  const [loadingConfig, setLoadingConfig] = useState(!template.config);

  useEffect(() => {
    // If config was not in the list response, fetch it on demand
    if (!template.config) {
      setLoadingConfig(true);
      getAgentTemplate(template.id)
        .then(res => setFullConfig(res?.config || {}))
        .catch(() => setFullConfig({}))
        .finally(() => setLoadingConfig(false));
    }
  }, [template.id, template.config]);

  const config = fullConfig || {};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        style={{
          width: '100%', maxWidth: 700, maxHeight: '90vh', background: 'white', borderRadius: 24,
          overflow: 'hidden', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.3)',
          display: 'flex', flexDirection: 'column'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>{template.name}</div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>Agent Configuration Template</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
            <FiX size={24} />
          </button>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid #F3F4F6' }}>
          {[
            { id: 'summary', label: 'Summary', icon: FiInfo },
            { id: 'config', label: 'Raw Configuration', icon: FiCode }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: '14px', border: 'none', background: 'none',
                fontSize: 13, fontWeight: 700, color: activeTab === tab.id ? 'var(--theme-primary)' : '#6B7280',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                borderBottom: activeTab === tab.id ? '2px solid var(--theme-primary)' : '2px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {activeTab === 'summary' ? (
            loadingConfig ? (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="loading-spinner" />
              </div>
            ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {template.description && (
                <section>
                  <h4 style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 10 }}>Description</h4>
                  <div style={{ padding: 16, background: '#F8FAFC', borderRadius: 12, border: '1px solid #F1F5F9', fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                    {template.description}
                  </div>
                </section>
              )}

              <section>
                <h4 style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 10 }}>Instructions</h4>
                <div style={{ padding: 16, background: '#F8FAFC', borderRadius: 12, border: '1px solid #F1F5F9', fontSize: 13, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {config.task || "No instructions defined for this agent template."}
                </div>
              </section>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <section>
                  <h4 style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 10 }}>LLM Settings</h4>
                  <div style={{ padding: 12, background: 'white', borderRadius: 12, border: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: '#64748B' }}>Provider</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#1E293B' }}>{config.llm?.provider || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: '#64748B' }}>Model</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#1E293B' }}>{config.llm?.model || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: '#64748B' }}>Temperature</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#1E293B' }}>{config.llm?.temperature || 0}</span>
                    </div>
                  </div>
                </section>

                <section>
                  <h4 style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 10 }}>Tools</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {(config.tools || []).length > 0 ? (config.tools || []).map(tool => (
                      <span key={tool} style={{ padding: '4px 10px', background: '#F1F5F9', color: '#475569', borderRadius: 6, fontSize: 11, fontWeight: 700, border: '1px solid #E2E8F0' }}>
                        {tool}
                      </span>
                    )) : (
                      <span style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>No tools assigned</span>
                    )}
                  </div>
                </section>
              </div>
            </div>
            )
          ) : (
            <div style={{ background: '#1E293B', borderRadius: 12, padding: 16, overflow: 'hidden' }}>
              <pre style={{
                margin: 0, fontSize: 12, color: '#E2E8F0',
                overflowX: 'auto', fontFamily: 'monospace',
                lineHeight: 1.5
              }}>
                {JSON.stringify(template, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div style={{ padding: '20px 24px', background: '#F8FAFC', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            onClick={onClose}
            style={{ padding: '10px 20px', background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#64748B', cursor: 'pointer' }}
          >
            Close
          </button>
          <button
            onClick={() => {
              onUse(template);
              onClose();
            }}
            style={{ 
              padding: '10px 24px', background: 'var(--theme-primary-glow)', color: 'var(--theme-primary)', 
              border: '1px solid var(--theme-primary-glow)', borderRadius: 10, fontSize: 13, 
              fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' 
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--theme-primary)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--theme-primary-glow)'; e.currentTarget.style.color = 'var(--theme-primary)'; }}
          >
            Use Agent
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AgentTypeSelectionModal({ onSelect, onClose }) {
  const types = [
    { id: 'llm_agent', label: 'Standard Agent', desc: 'Versatile LLM node with tools.', icon: FiCpu, color: '#3B82F6' },
    { id: 'deep_agent', label: 'Deep Agent', desc: 'Postgres-backed long-term memory.', icon: FiCpu, color: '#8B5CF6' },
    { id: 'supervisor', label: 'Supervisor', desc: 'Orchestrates multiple worker nodes.', icon: FiTarget, color: '#10B981' },
    { id: 'swarm', label: 'Swarm Agent', desc: 'Multi-agent emergent intelligence.', icon: FiShare2, color: '#EC4899' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        style={{
          width: '100%', maxWidth: 500, background: 'white', borderRadius: 24,
          overflow: 'hidden', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.3)',
          padding: '32px'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 8 }}>Select Node Type</h3>
          <p style={{ fontSize: 14, color: '#64748B' }}>Choose how you want to deploy this agent template on the canvas.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {types.map(t => (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                padding: '24px 16px', borderRadius: 16, border: '1px solid #F1F5F9',
                background: 'white', cursor: 'pointer', transition: 'all 0.2s',
                textAlign: 'center'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = t.color; e.currentTarget.style.background = `${t.color}05`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#F1F5F9'; e.currentTarget.style.background = 'white'; }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 12, background: `${t.color}10`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.color
              }}>
                <t.icon size={24} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 4 }}>{t.label}</div>
                <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.4 }}>{t.desc}</div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: 24, width: '100%', padding: '12px', borderRadius: 12, border: 'none',
            background: '#F1F5F9', color: '#64748B', fontSize: 13, fontWeight: 700, cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function AgentsPage() {
  const { nodes, setNodesDirty } = useWorkflowStore();
  const { refreshTrigger, setActivePage } = useUIStore();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [viewMode, setViewMode] = useState('cards');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateToUse, setTemplateToUse] = useState(null);
  const [groups, setGroups] = useState(['All']);
  const [categories, setCategories] = useState(['All']);
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterPanelRef = useRef(null);
  const searchInputRef = useRef(null);

  const handleUseTemplate = (template) => {
    setTemplateToUse(template);
  };

  const finalizeUseTemplate = async (type) => {
    if (!templateToUse) return;
    let config = templateToUse.config;
    // If config not in summary, fetch it now
    if (!config) {
      try {
        const full = await getAgentTemplate(templateToUse.id);
        config = full?.config || {};
      } catch { config = {}; }
    }
    const id = `${type}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Position it intelligently
    const lastNode = nodes[nodes.length - 1];
    const position = lastNode 
      ? { x: lastNode.position.x + 60, y: lastNode.position.y + 60 }
      : { x: 350, y: 250 };

    const newNode = {
      id,
      type: 'agentNode',
      position,
      data: {
        ...config,
        id,
        type, // Use the selected type
        label: templateToUse.name || config.label || type
      }
    };

    setNodesDirty([...nodes, newNode]);
    setTemplateToUse(null);
    setActivePage('canvas');
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 12;

  const containerRef = useRef(null);
  const { scrollY } = useScroll({ container: containerRef });

  // ⚡ Parallax Effects
  const bannerBgY = useTransform(scrollY, [0, 400], [0, 120]);
  const bannerScale = useTransform(scrollY, [0, 400], [1, 1.3]);
  const bannerOpacity = useTransform(scrollY, [0, 300], [0.12, 0.05]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listAgentTemplates({
        page: currentPage,
        limit: pageSize,
        search,
        group: selectedGroup === 'All' ? undefined : selectedGroup,
        category: selectedCategory === 'All' ? undefined : selectedCategory
      });
      setTemplates(res.templates || []);
      setTotal(res.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch unique groups and categories from a wide query of templates
    listAgentTemplates({ limit: 1000 })
      .then(res => {
        const templatesList = res.templates || [];
        const gSet = new Set();
        const cSet = new Set();
        templatesList.forEach(t => {
          if (t.group) gSet.add(t.group);
          if (t.category) cSet.add(t.category);
        });
        setGroups(['All', ...Array.from(gSet).sort()]);
        setCategories(['All', ...Array.from(cSet).sort()]);
      })
      .catch(e => console.error("Failed to load unique filters:", e));
  }, [refreshTrigger]);

  useEffect(() => {
    load();
  }, [currentPage, search, selectedGroup, selectedCategory]);

  const handleGroupChange = (val) => {
    setSelectedGroup(val);
    setCurrentPage(1);
  };

  const handleCategoryChange = (val) => {
    setSelectedCategory(val);
    setCurrentPage(1);
  };

  // Handle clicks outside filter panel
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterPanelRef.current && !filterPanelRef.current.contains(event.target)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this agent template?')) return;
    try {
      await deleteAgentTemplate(id);
      load();
    } catch (e) {
      alert('Delete failed: ' + e.message);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 32px', borderBottom: '1px solid var(--border-light)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <PageHeader 
          title="Agent Library" 
          description="Manage and customize autonomous agent blueprints, persona prompts, and underlying LLM configurations." 
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Search bar collapsible (Matching Marketplace) */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', transition: 'width 0.2s', width: (searchOpen || search) ? 320 : 36 }}>
            {(!searchOpen && !search) && (
              <button
                onClick={() => setSearchOpen(true)}
                title="Search templates..."
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8
                }}
              >
                <FiSearch size={18} color="#6B7280" />
              </button>
            )}
            {(searchOpen || search) && (
              <div style={{ position: 'relative', width: '100%' }}>
                <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} size={16} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search templates..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onBlur={() => { if (!search) setSearchOpen(false); }}
                  style={{
                    width: '100%', padding: '8px 12px 8px 36px', border: '1px solid #E5E7EB', borderRadius: 10,
                    fontSize: 14, outline: 'none', background: 'white', color: '#111827'
                  }}
                />
              </div>
            )}
          </div>

          {/* Filters Popover */}
          <div style={{ position: 'relative' }} ref={filterPanelRef}>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
                background: filterOpen ? '#111827' : 'white',
                color: filterOpen ? 'white' : '#111827',
                border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <FiFilter size={16} /> Filters
              {(selectedCategory !== 'All' || selectedGroup !== 'All') && (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444' }} />
              )}
            </button>

            <AnimatePresence>
              {filterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 260,
                    background: 'white', border: '1px solid #E5E7EB', borderRadius: 12,
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', zIndex: 100, padding: 16
                  }}
                >
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>By Group</div>
                    <select
                      value={selectedGroup}
                      onChange={(e) => handleGroupChange(e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: 8, outline: 'none', fontSize: 13 }}
                    >
                      {groups.map(g => <option key={g} value={g}>{g === 'All' ? 'All Groups' : g}</option>)}
                    </select>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>By Category</div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: 8, outline: 'none', fontSize: 13 }}
                    >
                      {categories.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
                    </select>
                  </div>

                  <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => { setSelectedCategory('All'); setSelectedGroup('All'); }}
                      style={{ padding: '6px 10px', fontSize: 12, color: '#6B7280', border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      Reset All
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ display: 'flex', gap: 2, background: 'var(--bg-canvas)', border: '1px solid var(--border)', borderRadius: 10, padding: '4px' }}>
            <button onClick={() => setViewMode('cards')} style={{ background: viewMode === 'cards' ? 'var(--theme-primary)' : 'transparent', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: viewMode === 'cards' ? 'white' : '#6B7280' }}><FiGrid size={16} /></button>
            <button onClick={() => setViewMode('list')} style={{ background: viewMode === 'list' ? 'var(--theme-primary)' : 'transparent', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: viewMode === 'list' ? 'white' : '#6B7280' }}><FiList size={16} /></button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }} ref={containerRef}>
        {/* ── Agent Banner — only show once agents exist ── */}
        {!loading && total > 0 && (
        <div style={{
          position: 'relative',
          width: '100%',
          height: '240px',
          background: 'linear-gradient(135deg, #4c1d95 0%, #1e1b4b 100%)',
          borderRadius: '24px',
          marginBottom: '40px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 20px 50px rgba(76, 29, 149, 0.15)',
          border: '1px solid rgba(142, 119, 187, 0.2)'
        }}>
          {/* Decorative Image */}
          <motion.img
            src={bannerImage}
            alt="Mesh Stack"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: bannerOpacity,
              pointerEvents: 'none',
              filter: 'hue-rotate(235deg) saturate(2) brightness(1.2)',
              scale: bannerScale,
              y: bannerBgY
            }}
          />

          <div style={{
            position: 'absolute',
            left: '30%',
            top: '-20%',
            width: '60%',
            height: '100%',
            background: 'radial-gradient(circle, rgba(142, 119, 187, 0.2) 0%, transparent 70%)',
            opacity: 0.6,
            filter: 'blur(80px)'
          }} />

          {/* Banner Content */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              fontSize: '44px',
              fontWeight: 900,
              color: 'white',
              margin: 0,
              letterSpacing: '-0.04em',
              zIndex: 2,
              textAlign: 'center',
              textShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}
          >
            Your Private Agent Library
          </motion.h2>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              position: 'absolute',
              bottom: '24px',
              fontSize: '13px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.7)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              zIndex: 2,
              opacity: 0.9,
              background: 'rgba(255,255,255,0.1)',
              padding: '6px 16px',
              borderRadius: '20px',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            Manage and Deploy Specialized Custom Agents
          </motion.div>
        </div>
        )}

        {loading ? (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="loading-spinner" />
          </div>
        ) : templates.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            minHeight: '300px',
            gap: 16,
            color: '#64748B'
          }}>
            <FiUser size={48} strokeWidth={1} />
            <div style={{ fontSize: 14, fontWeight: 500 }}>No agent templates found</div>
          </div>
        ) : (
          <div style={{
            display: viewMode === 'cards' ? 'grid' : 'flex',
            flexDirection: viewMode === 'cards' ? 'unset' : 'column',
            gridTemplateColumns: viewMode === 'cards' ? 'repeat(auto-fill, minmax(320px, 1fr))' : 'unset',
            gap: 24
          }}>
            {templates.map((t, i) => (
              <AgentTemplateCard
                key={t.id} t={t} idx={i}
                onDetails={setSelectedTemplate}
                onDelete={handleDelete}
                onUse={handleUseTemplate}
              />
            ))}
          </div>
        )}

        {total > pageSize && (
          <div style={{ marginTop: 40 }}>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(total / pageSize)}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedTemplate && (
          <AgentDetailsModal
            template={selectedTemplate}
            onClose={() => setSelectedTemplate(null)}
            onUse={handleUseTemplate}
          />
        )}
        {templateToUse && (
          <AgentTypeSelectionModal 
            onClose={() => setTemplateToUse(null)}
            onSelect={finalizeUseTemplate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
