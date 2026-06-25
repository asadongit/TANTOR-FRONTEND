import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useWorkflowStore, useUIStore } from '../../../store';
import { listComponentTemplates, deleteComponentTemplate, listComponentTemplateFilters } from '../../../api/agentmesh';
import { PREDEFINED_API_CATEGORIES } from '../../../constants/apiCategories';
import {
  FiSearch, FiGlobe, FiGrid, FiList,
  FiFilter, FiX, FiTrash2, FiLock
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Pagination from '../../Common/Pagination';
import ConfirmationModal from '../../Common/ConfirmationModal';
import PageHeader from '../../Common/PageHeader';
import LibraryCard from '../../Common/LibraryCard';
import LibraryListRow from '../../Common/LibraryListRow';

// Application purple theme for APIs to match Agents
const API_THEME = {
  primary: 'var(--theme-primary)', // #7C3AED
  bg: 'var(--theme-primary-glow)', // #F5F3FF
  accent: '#EDE9FE',               // Violet 100
  border: '#DDD6FE',               // Violet 200
  text: 'var(--text-primary)'
};

function ApiTemplateCard({ t, onDetails, onDelete, onUse, idx }) {
  const predefined = PREDEFINED_API_CATEGORIES.find(c => c.name === t.category_name);
  const categoryDesc = predefined ? predefined.description : "Custom API Endpoint";

  const tags = [];
  if (t.group) tags.push(t.group);
  if (t.category_name) tags.push(t.category_name);

  const moreActions = [
    { label: 'Delete', icon: <FiTrash2 size={14} />, onClick: () => onDelete(t.id), variant: 'danger' },
  ];

  return (
    <LibraryCard
      icon={<FiGlobe size={22} strokeWidth={2} />}
      title={t.name}
      description={t.description || categoryDesc}
      tags={tags}
      primaryAction={{ label: '+ Add', onClick: () => onUse(t) }}
      secondaryAction={{ label: 'Details', onClick: () => onDetails(t) }}
      moreActions={moreActions}
      idx={idx}
      onClick={() => onDetails(t)}
    />
  );
}

ApiTemplateCard.propTypes = {
  t: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    category_name: PropTypes.string,
    group: PropTypes.string
  }).isRequired,
  onDetails: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onUse: PropTypes.func.isRequired,
  idx: PropTypes.number.isRequired
};

function ApiListRow({ t, onDetails, onDelete, onUse, idx }) {
  const predefined = PREDEFINED_API_CATEGORIES.find(c => c.name === t.category_name);
  const categoryDesc = predefined ? predefined.description : "Custom API Endpoint";

  const tags = [];
  if (t.group) tags.push(t.group);
  if (t.category_name) tags.push(t.category_name);

  const moreActions = [
    { label: 'Delete', icon: <FiTrash2 size={14} />, onClick: () => onDelete(t.id), variant: 'danger' },
  ];

  return (
    <LibraryListRow
      icon={<FiGlobe size={22} />}
      title={t.name}
      description={t.description || categoryDesc}
      tags={tags}
      primaryAction={{ label: '+ Add', onClick: () => onUse(t) }}
      secondaryAction={{ label: 'Details', onClick: () => onDetails(t) }}
      moreActions={moreActions}
      idx={idx}
      onClick={() => onDetails(t)}
    />
  );
}

ApiListRow.propTypes = {
  t: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    category_name: PropTypes.string,
    group: PropTypes.string
  }).isRequired,
  onDetails: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onUse: PropTypes.func.isRequired,
  idx: PropTypes.number.isRequired
};

function ApiDetailsModal({ template, onClose, onUse }) {
  const config = template.config || {};
  const predefined = PREDEFINED_API_CATEGORIES.find(c => c.name === template.category_name);
  const categoryDesc = predefined ? predefined.description : "Custom API Endpoint";
  const displayDesc = template.description || categoryDesc;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
        style={{
          width: '100%', maxWidth: 700, maxHeight: '90vh', background: 'white', borderRadius: 24, overflow: 'hidden', 
          boxShadow: '0 40px 100px -20px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--theme-primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-primary)' }}>
              <FiGlobe size={20} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>{template.name}</div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>Global API Endpoint Configuration</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
            <FiX size={24} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {displayDesc && (
            <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, padding: '16px', background: '#F8FAFC', borderRadius: 12, border: '1px solid #F1F5F9' }}>
              {displayDesc}
            </div>
          )}
          <section>
            <h4 style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 10 }}>Endpoint Details</h4>
            <div style={{ padding: 16, background: '#F8FAFC', borderRadius: 12, border: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ 
                  fontSize: 11, fontWeight: 800, padding: '4px 8px', borderRadius: 6,
                  background: config.api_method === 'POST' ? '#DCFCE7' : 'var(--theme-primary-glow)',
                  color: config.api_method === 'POST' ? '#16A34A' : 'var(--theme-primary)' 
                }}>
                  {config.api_method || 'GET'}
                </span>
                <span style={{ fontSize: 14, fontFamily: 'monospace', color: '#334155', wordBreak: 'break-all' }}>
                  {config.api_url || 'https://api.example.com/v1/resource'}
                </span>
              </div>
            </div>
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <section>
              <h4 style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 10 }}>Authentication</h4>
              <div style={{ padding: 16, background: 'white', borderRadius: 12, border: '1px solid #F1F5F9', height: '100%', display: 'flex', alignItems: 'center', gap: 12 }}>
                <FiLock size={20} color="#94A3B8" />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>{config.api_auth_type || 'None'}</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>
                    {config.api_auth_type === 'Vault' ? 'Secured via Enterprise Vault' : 'Raw Credentials (Scrubbed)'}
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h4 style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 10 }}>Configuration</h4>
              <div style={{ padding: 12, background: 'white', borderRadius: 12, border: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: '#64748B' }}>Headers Configured</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1E293B' }}>{config.api_headers?.length ? 'Yes' : 'No'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: '#64748B' }}>Body Payload</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1E293B' }}>{config.api_body ? 'Configured' : 'Empty'}</span>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div style={{ padding: '20px 24px', background: '#F8FAFC', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#64748B', cursor: 'pointer' }}>
            Close
          </button>
          <button
            onClick={() => { onUse(template); onClose(); }}
            style={{ 
              padding: '10px 24px', background: 'var(--theme-primary-glow)', color: 'var(--theme-primary)', border: '1px solid #DDD6FE', borderRadius: 10, 
              fontSize: 13, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' 
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--theme-primary)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--theme-primary-glow)'; e.currentTarget.style.color = 'var(--theme-primary)'; }}
          >
            Add to Canvas
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

ApiDetailsModal.propTypes = {
  template: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    category_name: PropTypes.string,
    config: PropTypes.object
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onUse: PropTypes.func.isRequired
};

export default function APIsPage() {
  const { nodes, setNodesDirty } = useWorkflowStore();
  const { refreshTrigger, setActivePage } = useUIStore();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [viewMode, setViewMode] = useState('cards');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  const [groups, setGroups] = useState(['All']);
  const [categories, setCategories] = useState(['All']);
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterOpen, setFilterOpen] = useState(false);
  
  const filterPanelRef = useRef(null);
  const searchInputRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const pageSize = 12;

  const handleUseTemplate = (template) => {
    const config = template.config || {};
    const id = `api_node_${Math.random().toString(36).substring(2, 7)}`;
    
    // Position intelligently
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
        type: 'api_node',
        label: template.name || config.label || 'API Node'
      }
    };

    setNodesDirty([...nodes, newNode]);
    setActivePage('canvas');
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await listComponentTemplates({
        type: 'api_node',
        page: currentPage,
        limit: pageSize,
        search,
        group: selectedGroup === 'All' ? undefined : selectedGroup,
        category_name: selectedCategory === 'All' ? undefined : selectedCategory
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
    // Fetch unique groups and categories in a single call
    listComponentTemplateFilters('api_node')
      .then(res => {
        // Set Categories
        const dbCats = res.categories || [];
        const cSet = new Set(PREDEFINED_API_CATEGORIES.map(c => c.name));
        dbCats.forEach(c => cSet.add(c.name));
        setCategories(['All', ...Array.from(cSet).sort()]);
        
        // Set Groups
        const dbGroups = res.groups || [];
        setGroups(['All', ...dbGroups]);
      })
      .catch(e => console.error("Failed to load unique filters:", e));
  }, [refreshTrigger]);

  useEffect(() => {
    load();
  }, [currentPage, search, selectedGroup, selectedCategory]);

  // Focus search input when searchOpen is true
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Keydown listener for 's' keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
         activeEl.tagName === 'TEXTAREA' ||
         activeEl.isContentEditable)
      ) {
        return;
      }
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        }, 50);
      }
    };
    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDeleteClick = (id) => {
    setConfirmDeleteId(id);
  };

  const confirmDeleteTemplate = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteComponentTemplate(confirmDeleteId);
      load();
    } catch (e) {
      alert('Delete failed: ' + e.message);
    } finally {
      setConfirmDeleteId(null);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 32px', borderBottom: '1px solid var(--border-light)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <PageHeader 
          title="API Library" 
          description="Register, configure, and manage external REST and GraphQL APIs for integration into agentic workflows." 
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Search bar */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', transition: 'width 0.2s', width: (searchOpen || search) ? 320 : 36 }}>
            {(!searchOpen && !search) && (
              <button onClick={() => setSearchOpen(true)} title="Search templates..." style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                <FiSearch size={18} color="#6B7280" />
              </button>
            )}
            {(searchOpen || search) && (
              <div style={{ position: 'relative', width: '100%' }}>
                <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} size={16} />
                <input
                  ref={searchInputRef} type="text" placeholder="Search API templates..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  onBlur={() => { if (!search) setSearchOpen(false); }}
                  style={{ width: '100%', padding: '8px 12px 8px 36px', border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 14, outline: 'none', background: 'white', color: '#111827' }}
                />
              </div>
            )}
          </div>

          {/* Filters Popover */}
          <div style={{ position: 'relative' }} ref={filterPanelRef}>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: filterOpen ? 'var(--theme-primary)' : 'white', color: filterOpen ? 'white' : '#111827', border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <FiFilter size={16} /> Filters
              {(selectedCategory !== 'All' || selectedGroup !== 'All') && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444' }} />}
            </button>
            {filterOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 260, background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', zIndex: 100, padding: 16 }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 8 }}>By Group</div>
                  <select value={selectedGroup} onChange={(e) => {setSelectedGroup(e.target.value); setCurrentPage(1);}} style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: 8, outline: 'none', fontSize: 13 }}>
                    {groups.map(g => <option key={g} value={g}>{g === 'All' ? 'All Groups' : g}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 8 }}>By Category</div>
                  <select value={selectedCategory} onChange={(e) => {setSelectedCategory(e.target.value); setCurrentPage(1);}} style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: 8, outline: 'none', fontSize: 13 }}>
                    {categories.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
                  </select>
                </div>
                <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => { setSelectedCategory('All'); setSelectedGroup('All'); }} style={{ padding: '6px 10px', fontSize: 12, color: '#6B7280', border: 'none', background: 'none', cursor: 'pointer' }}>Reset</button>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 2, background: 'var(--bg-canvas)', border: '1px solid var(--border)', borderRadius: 10, padding: '4px' }}>
            <button onClick={() => setViewMode('cards')} style={{ background: viewMode === 'cards' ? 'var(--theme-primary)' : 'transparent', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: viewMode === 'cards' ? 'white' : '#6B7280' }}><FiGrid size={16} /></button>
            <button onClick={() => setViewMode('list')} style={{ background: viewMode === 'list' ? 'var(--theme-primary)' : 'transparent', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: viewMode === 'list' ? 'white' : '#6B7280' }}><FiList size={16} /></button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        {loading ? (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="loading-spinner" /></div>
        ) : templates.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', gap: 16, color: '#64748B' }}>
            <FiGlobe size={48} strokeWidth={1} color="#DDD6FE" />
            <div style={{ fontSize: 14, fontWeight: 500 }}>No API templates found in the library.</div>
          </div>
        ) : (
          <div style={{ display: viewMode === 'cards' ? 'grid' : 'flex', flexDirection: viewMode === 'cards' ? 'unset' : 'column', gridTemplateColumns: viewMode === 'cards' ? 'repeat(auto-fill, minmax(320px, 1fr))' : 'unset', gap: 24 }}>
            {templates.map((t, i) => (
              <ApiTemplateCard key={t.id} t={t} idx={i} onDetails={setSelectedTemplate} onDelete={handleDeleteClick} onUse={handleUseTemplate} />
            ))}
          </div>
        )}

        {total > pageSize && (
          <div style={{ marginTop: 40 }}><Pagination currentPage={currentPage} totalPages={Math.ceil(total / pageSize)} onPageChange={setCurrentPage} /></div>
        )}
      </div>

      <AnimatePresence>
        {selectedTemplate && <ApiDetailsModal template={selectedTemplate} onClose={() => setSelectedTemplate(null)} onUse={handleUseTemplate} />}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={confirmDeleteTemplate}
        title="Delete API Template?"
        message="Are you sure you want to delete this API template? It will be removed from your library permanently."
        confirmText="Delete Template"
        variant="danger"
      />
    </div>
  );
}
