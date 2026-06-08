import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiFileText, FiClock, FiCheckCircle, FiSearch, FiRefreshCw, FiTag, 
  FiEyeOff, FiUsers, FiGlobe, FiFilter, FiX, FiCheck, FiTrash2, FiAlertCircle,
  FiGrid, FiList
} from 'react-icons/fi';
import { ReactFlow, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import AgentNode from '../../../Editor/Nodes/AgentNode';
import CardboardNode from '../../../Editor/Nodes/CardboardNode';
import { 
  listWorkflowTemplates, 
  getWorkflowTemplate, 
  updateWorkflowTemplateStatus, 
  deleteWorkflowTemplate 
} from '../../../../api/agentmesh';
import Pagination from '../../../Common/Pagination';

// Visual preview rendering showing flow structure
function WorkflowMinimap({ nodes = [], edges = [] }) {
  if (!nodes || nodes.length === 0) {
    return (
      <div style={{ height: 130, background: '#F8FAFC', borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 11, borderBottom: '1px solid #F1F5F9' }}>
        <FiFileText size={20} style={{ marginRight: 6, opacity: 0.6 }} /> No layout preview
      </div>
    );
  }

  const xs = nodes.map(n => n.position?.x ?? 0);
  const ys = nodes.map(n => n.position?.y ?? 0);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const padding = 28;
  const width = 300;
  const height = 130;

  const scaleX = maxX === minX ? 1 : (width - padding * 2) / (maxX - minX);
  const scaleY = maxY === minY ? 1 : (height - padding * 2) / (maxY - minY);

  const getPos = (n) => {
    const x = maxX === minX ? width / 2 : padding + ((n.position?.x ?? 0) - minX) * scaleX;
    const y = maxY === minY ? height / 2 : padding + ((n.position?.y ?? 0) - minY) * scaleY;
    return { x, y };
  };

  const NODE_CONFIGS = {
    start:      { bg: '#F8F9FA', color: '#10B981', label: 'START', type: 'Trigger' },
    end:        { bg: '#F8F9FA', color: '#EF4444', label: 'END', type: 'Terminal' },
    llm_agent:  { bg: '#F0F7FF', color: '#3B82F6', label: 'LLM Agent', type: 'Agent' },
    deep_agent: { bg: '#F5F3FF', color: '#8B5CF6', label: 'Deep Agent', type: 'Agent' },
    classification: { bg: '#C9DEFF', color: '#1A56DB', label: 'Classifier', type: 'Router' },
    tool_node:  { bg: '#FFF7ED', color: '#F97316', label: 'Tool Node', type: 'Tool' },
    direct_tool: { bg: '#FFF7ED', color: '#F97316', label: 'Direct Tool', type: 'Tool' },
    button_trigger: { bg: '#D1FAE5', color: '#059669', label: 'Button', type: 'Trigger' },
    splitter:   { bg: '#FFF7ED', color: '#EA580C', label: 'Splitter', type: 'Logic' },
    router:     { bg: '#F5F3FF', color: '#8B5CF6', label: 'Router', type: 'Logic' },
    supervisor: { bg: '#ECFDF5', color: '#10B981', label: 'Supervisor', type: 'Agent' },
    swarm:      { bg: '#FDF2F8', color: '#EC4899', label: 'Swarm', type: 'Swarm' },
    rag_node:   { bg: '#FFFBEB', color: '#F59E0B', label: 'RAG Node', type: 'Knowledge' },
    subgraph:   { bg: '#F0FDFA', color: '#14B8A6', label: 'Subgraph', type: 'Link' },
    cron:       { bg: '#FEF3C7', color: '#B45309', label: 'Cron', type: 'Trigger' },
    api_node:   { bg: '#E0F2FE', color: '#0EA5E9', label: 'API Request', type: 'Integration' },
    notification: { bg: '#F0F4FF', color: '#6366F1', label: 'Alert', type: 'Notify' }
  };

  const computedNodes = nodes.map(n => ({
    ...n,
    pos: getPos(n)
  }));

  return (
    <svg width="100%" height="130" style={{ background: '#FAFBFD', borderRadius: '16px 16px 0 0', display: 'block', borderBottom: '1px solid #EAEAEA' }}>
      <defs>
        <pattern id="miniGrid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#F1F5F9" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="130" fill="url(#miniGrid)" />

      {edges.map((e, idx) => {
        const src = computedNodes.find(n => n.id === e.source);
        const tgt = computedNodes.find(n => n.id === e.target);
        if (!src || !tgt) return null;
        return (
          <line
            key={e.id || idx}
            x1={src.pos.x}
            y1={src.pos.y}
            x2={tgt.pos.x}
            y2={tgt.pos.y}
            stroke="#CBD5E1"
            strokeWidth="1.2"
          />
        );
      })}

      {computedNodes.map(n => {
        const config = NODE_CONFIGS[n.type] || { bg: '#F1F5F9', color: '#64748B', label: (n.type || 'NODE').toUpperCase().slice(0, 10), type: 'Node' };
        const nodeW = 56;
        const nodeH = 20;
        const labelText = n.label || config.label;
        const truncatedLabel = labelText.length > 10 ? labelText.slice(0, 8) + '..' : labelText;

        return (
          <g key={n.id} transform={`translate(${n.pos.x - nodeW / 2}, ${n.pos.y - nodeH / 2})`}>
            <rect
              width={nodeW}
              height={nodeH}
              rx="4"
              ry="4"
              fill="white"
              stroke="rgba(0,0,0,0.06)"
              strokeWidth="0.8"
              style={{ filter: 'drop-shadow(0px 1px 3px rgba(0,0,0,0.05))' }}
            />
            <rect
              x="3"
              y="3"
              width="14"
              height="14"
              rx="2.5"
              ry="2.5"
              fill={config.bg}
              stroke="rgba(0,0,0,0.02)"
              strokeWidth="0.5"
            />
            <circle cx="10" cy="10" r="2.5" fill={config.color} />
            <text
              x="20"
              y="10"
              fontSize="4.8"
              fontFamily="-apple-system, BlinkMacSystemFont, sans-serif"
              fontWeight="800"
              fill="#111827"
            >
              {truncatedLabel}
            </text>
            <text
              x="20"
              y="15"
              fontSize="3.8"
              fontFamily="-apple-system, BlinkMacSystemFont, sans-serif"
              fontWeight="600"
              fill="#9CA3AF"
            >
              {config.type.toUpperCase()}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const mapConfigNodesToRFNodes = (rawNodes = [], frontendMeta = {}, triggers = {}) => {
  const systemPositions = frontendMeta.system_positions || {};
  const cardboards = frontendMeta.cardboards || [];

  const rfNodes = rawNodes.map((n, i) => {
    const type = n.type || 'llm_agent';
    const isCardboard = type === 'cardboard';
    return {
      id: n.id,
      type: isCardboard ? 'cardboardNode' : 'agentNode',
      position: n.position || { x: 250 + (i % 3) * 280, y: 100 + Math.floor(i / 3) * 220 },
      data: {
        ...n,
        ...(n.data || {}),
        id: n.id,
        type,
        label: n.label || n.data?.label || n.id
      }
    };
  });

  const hasStart = rfNodes.some(n => n.id === '__start__' || n.data?.type === 'start');
  const hasEnd = rfNodes.some(n => n.id === '__end__' || n.data?.type === 'end');

  if (!hasStart) {
    rfNodes.unshift({
      id: '__start__',
      type: 'agentNode',
      position: systemPositions['__start__'] || { x: 50, y: 200 },
      data: { id: '__start__', type: 'start', label: 'START' }
    });
  }
  if (!hasEnd) {
    rfNodes.push({
      id: '__end__',
      type: 'agentNode',
      position: systemPositions['__end__'] || { x: 800, y: 200 },
      data: { id: '__end__', type: 'end', label: 'END' }
    });
  }

  const restoredCardboards = cardboards.map(n => ({
    ...n,
    type: 'cardboardNode',
    draggable: false
  }));

  return [...restoredCardboards, ...rfNodes];
};

const mapConfigEdgesToRFEdges = (rawEdges = [], rawNodes = []) => {
  const startNode = rawNodes.find(n => n.type === 'start');
  const endNode = rawNodes.find(n => n.type === 'end');

  return rawEdges.map((e, i) => {
    const cond = e.condition;
    const hasCond = cond && cond.key && cond.value;
    return {
      id: `e${i}`,
      source: (e.source === 'START' || e.source === 'start' || e.source === startNode?.id) ? '__start__' : e.source,
      target: (e.target === 'END' || e.target === 'end' || e.target === endNode?.id) ? '__end__' : e.target,
      sourceHandle: e.source_handle || e.sourceHandle || null,
      targetHandle: e.target_handle || e.targetHandle || null,
      data: { condition: e.condition },
      animated: !!hasCond,
      label: hasCond ? `${cond.key} ${cond.operator || '=='} ${cond.value}` : null,
      labelStyle: { fill: '#4F46E5', fontWeight: 700, fontSize: 10 },
      labelBgStyle: { fill: '#F5F3FF', fillOpacity: 0.9, rx: 4, stroke: '#C7D2FE', strokeWidth: 1 },
      type: 'smoothstep',
      style: { stroke: '#CBD5E1', strokeWidth: 1.5 },
    };
  });
};

export default function WorkflowTemplateController() {
  const nodeTypes = React.useMemo(() => ({ 
    agentNode: AgentNode,
    cardboardNode: CardboardNode
  }), []);

  const [activeTab, setActiveTab] = useState('pending'); // pending, approved, rejected, all
  const [viewMode, setViewMode] = useState('card'); // card, list
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedScope, setSelectedScope] = useState('All');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('All');
  const [actionInProgress, setActionInProgress] = useState(null);

  // Modal details state
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateDetails, setTemplateDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [filterOpen, setFilterOpen] = useState(false);
  const filterPanelRef = useRef(null);
  const searchInputRef = useRef(null);

  const [categories, setCategories] = useState(['All']);
  const [groups, setGroups] = useState(['All']);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalTemplates, setTotalTemplates] = useState(0);

  const totalPages = Math.ceil(totalTemplates / pageSize);

  const displayNodes = React.useMemo(() => {
    if (!templateDetails || !templateDetails.config) return [];
    const config = templateDetails.config;
    return mapConfigNodesToRFNodes(config.nodes || [], config.frontend_meta || {}, config.triggers || {});
  }, [templateDetails]);

  const displayEdges = React.useMemo(() => {
    if (!templateDetails || !templateDetails.config) return [];
    const config = templateDetails.config;
    return mapConfigEdgesToRFEdges(config.edges || [], config.nodes || []);
  }, [templateDetails]);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listWorkflowTemplates({
        page: currentPage,
        limit: pageSize,
        group: selectedGroupFilter,
        category: selectedCategory,
        scope: selectedScope,
        search: debouncedSearch,
        status: activeTab
      });
      if (res.status === 'success') {
        setTemplates(res.templates || []);
        setTotalTemplates(res.total || 0);
        if (res.unique_groups) {
          setGroups(['All', ...res.unique_groups]);
        }
        if (res.unique_categories) {
          setCategories(['All', ...res.unique_categories]);
        }
      }
    } catch (e) {
      setError(e.message || 'Failed to load templates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [currentPage, selectedCategory, selectedGroupFilter, selectedScope, debouncedSearch, activeTab]);

  useEffect(() => {
    if (!selectedTemplate) {
      setTemplateDetails(null);
      return;
    }
    const fetchDetails = async () => {
      setLoadingDetails(true);
      try {
        const res = await getWorkflowTemplate(selectedTemplate.id);
        if (res.status === 'success') {
          setTemplateDetails(res);
        }
      } catch (e) {
        console.error("Failed to load template configuration:", e);
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchDetails();
  }, [selectedTemplate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedGroupFilter, selectedScope, debouncedSearch, activeTab]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (filterPanelRef.current && !filterPanelRef.current.contains(event.target)) {
        setFilterOpen(false);
      }
    }
    if (filterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterOpen]);

  const handleUpdateStatus = async (id, status) => {
    setActionInProgress(id);
    try {
      const res = await updateWorkflowTemplateStatus(id, status);
      if (res.status === 'success') {
        loadTemplates();
        if (selectedTemplate && selectedTemplate.id === id) {
          setSelectedTemplate(null);
        }
      }
    } catch (e) {
      alert('Failed to update status: ' + e.message);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this template? This action cannot be undone.")) return;
    setActionInProgress(id);
    try {
      const res = await deleteWorkflowTemplate(id);
      if (res.status === 'success') {
        loadTemplates();
        if (selectedTemplate && selectedTemplate.id === id) {
          setSelectedTemplate(null);
        }
      }
    } catch (e) {
      alert('Failed to delete template: ' + e.message);
    } finally {
      setActionInProgress(null);
    }
  };

  const getScopeIcon = (scope) => {
    switch (scope) {
      case 'private': return <FiEyeOff size={12} color="#EF4444" />;
      case 'member': return <FiUsers size={12} color="#3B82F6" />;
      case 'public': return <FiGlobe size={12} color="#10B981" />;
      default: return null;
    }
  };

  const getStatusBadge = (status) => {
    let bg = '#FEF3C7', text = '#D97706', label = 'Pending';
    if (status === 'approved') {
      bg = '#D1FAE5'; text = '#059669'; label = 'Approved';
    } else if (status === 'rejected') {
      bg = '#FEE2E2'; text = '#DC2626'; label = 'Rejected';
    }
    return (
      <span style={{ 
        padding: '3px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700, 
        background: bg, color: text, textTransform: 'uppercase', letterSpacing: '0.04em' 
      }}>
        {label}
      </span>
    );
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F8FAFC', height: '100%', overflow: 'hidden', fontFamily: "'Google Sans','Roboto',sans-serif" }}>
      {/* Header */}
      <div style={{ 
        padding: '16px 32px', 
        background: 'white', 
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>Template Approval Queue</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Review and approve submitted agent-mesh templates for the global marketplace.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Search bar */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', transition: 'all 0.2s', width: (searchOpen || search) ? 260 : 36 }}>
            {(!searchOpen && !search) && (
              <button
                onClick={() => setSearchOpen(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}
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
                  onChange={(e) => setSearch(e.target.value)}
                  onBlur={() => { if (!search) setSearchOpen(false); }}
                  autoFocus={searchOpen && !search}
                  style={{
                    width: '100%', padding: '8px 12px 8px 36px', border: '1px solid #E5E7EB', borderRadius: 10,
                    fontSize: 14, outline: 'none', background: 'white', color: '#111827', boxSizing: 'border-box'
                  }}
                />
              </div>
            )}
          </div>

          <button
            onClick={loadTemplates}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--theme-primary-glow)', color: 'var(--theme-primary)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            <FiRefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>

          {/* Filters */}
          <div style={{ position: 'relative' }} ref={filterPanelRef}>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
                background: filterOpen ? '#111827' : 'white', color: filterOpen ? 'white' : '#111827',
                border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
              }}
            >
              <FiFilter size={16} /> Filters
              {(selectedCategory !== 'All' || selectedGroupFilter !== 'All' || selectedScope !== 'All') && (
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
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Scope</div>
                    <select
                      value={selectedScope}
                      onChange={(e) => setSelectedScope(e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 13, background: 'white' }}
                    >
                      <option value="All">All Scopes</option>
                      <option value="private">Private</option>
                      <option value="member">Member</option>
                      <option value="public">Public</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Group</div>
                    <select
                      value={selectedGroupFilter}
                      onChange={(e) => setSelectedGroupFilter(e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 13, background: 'white' }}
                    >
                      <option value="All">All Groups</option>
                      {groups.filter(g => g !== 'All').map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Category</div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 13, background: 'white' }}
                    >
                      <option value="All">All Categories</option>
                      {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ display: 'flex', border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
            <button 
              onClick={() => setViewMode('card')}
              style={{
                background: viewMode === 'card' ? '#111827' : 'white',
                color: viewMode === 'card' ? 'white' : '#6B7280',
                border: 'none', padding: '8px 12px', display: 'flex', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s'
              }}
              title="Card View"
            >
              <FiGrid size={16} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              style={{
                background: viewMode === 'list' ? '#111827' : 'white',
                color: viewMode === 'list' ? 'white' : '#6B7280',
                border: 'none', padding: '8px 12px', display: 'flex', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s'
              }}
              title="List View"
            >
              <FiList size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: 24, padding: '0 32px' }}>
        {[
          { key: 'pending', label: 'Pending Approval' },
          { key: 'approved', label: 'Approved' },
          { key: 'rejected', label: 'Rejected' },
          { key: 'All', label: 'All Templates' }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: '16px 0', border: 'none', background: 'none', fontSize: 14, fontWeight: 600,
              color: activeTab === t.key ? 'var(--theme-primary)' : '#64748B',
              borderBottom: activeTab === t.key ? '2px solid var(--theme-primary)' : '2px solid transparent',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Grid Content */}
      <div style={{ flex: 1, padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 80, gap: 12, color: 'var(--text-muted)' }}>
            <div className="loading-spinner" /> <span style={{ fontSize: 14 }}>Loading templates…</span>
          </div>
        )}

        {!loading && error && (
          <div style={{ padding: '14px 20px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 12, color: '#DC2626', fontSize: 13, marginBottom: 24 }}>
            {error}
          </div>
        )}

        {!loading && !error && templates.length === 0 ? (
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
            <FiFileText size={48} strokeWidth={1} />
            <div style={{ fontSize: 14, fontWeight: 500 }}>No templates found</div>
          </div>
        ) : (
          !loading && (
            viewMode === 'card' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24, marginBottom: 24 }}>
                {templates.map((t, idx) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.04 }}
                    style={{
                      background: 'white', border: '1px solid #EAEAEA', borderRadius: 16,
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column',
                      cursor: 'pointer', transition: 'all 0.2s', overflow: 'hidden'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.boxShadow = '0 12px 20px -3px rgba(0, 0, 0, 0.08)';
                      e.currentTarget.style.borderColor = '#CBD5E1';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.03)';
                      e.currentTarget.style.borderColor = '#EAEAEA';
                    }}
                    onClick={() => setSelectedTemplate(t)}
                  >
                    <WorkflowMinimap nodes={t.preview_nodes} edges={t.preview_edges} />

                    <div style={{ padding: 18, display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <FiTag size={10} /> {t.category}
                        </span>
                        {getStatusBadge(t.status)}
                      </div>

                      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 6px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.name}
                      </h3>

                      <p style={{ fontSize: 12, color: '#4B5563', lineHeight: 1.4, margin: '0 0 12px 0', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {t.description || 'No description provided.'}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F3F4F6', paddingTop: 12, marginTop: 'auto' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase' }}>
                          {getScopeIcon(t.scope)} {t.scope}
                        </span>

                        <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                          {t.status !== 'approved' && (
                            <button
                              onClick={() => handleUpdateStatus(t.id, 'approved')}
                              disabled={actionInProgress === t.id}
                              style={{ padding: '6px 8px', borderRadius: 6, background: '#D1FAE5', color: '#059669', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700 }}
                              title="Approve Template"
                            >
                              <FiCheck /> Approve
                            </button>
                          )}
                          {t.status !== 'rejected' && (
                            <button
                              onClick={() => handleUpdateStatus(t.id, 'rejected')}
                              disabled={actionInProgress === t.id}
                              style={{ padding: '6px 8px', borderRadius: 6, background: '#FEE2E2', color: '#DC2626', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700 }}
                              title="Reject Template"
                            >
                              <FiX /> Reject
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(t.id)}
                            disabled={actionInProgress === t.id}
                            style={{ padding: '6px 8px', borderRadius: 6, background: '#F1F5F9', color: '#64748B', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700 }}
                            title="Delete Template"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {templates.map((t, idx) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.02 }}
                    onClick={() => setSelectedTemplate(t)}
                    style={{
                      background: 'white', border: '1px solid #EAEAEA', borderRadius: 12, padding: '14px 20px',
                      display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'all 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#EAEAEA'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)'; }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--theme-primary-glow)', color: 'var(--theme-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FiFileText size={18} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>{t.name}</h3>
                        {getStatusBadge(t.status)}
                      </div>
                      <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.description || 'No description provided.'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', background: '#F1F5F9', padding: '4px 8px', borderRadius: 6 }}>
                        {t.category}
                      </span>
                      <span style={{ fontSize: 11, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {getScopeIcon(t.scope)} {t.scope}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                      {t.status !== 'approved' && (
                        <button
                          onClick={() => handleUpdateStatus(t.id, 'approved')}
                          disabled={actionInProgress === t.id}
                          style={{ padding: '6px 10px', borderRadius: 6, background: '#D1FAE5', color: '#059669', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
                        >
                          Approve
                        </button>
                      )}
                      {t.status !== 'rejected' && (
                        <button
                          onClick={() => handleUpdateStatus(t.id, 'rejected')}
                          disabled={actionInProgress === t.id}
                          style={{ padding: '6px 10px', borderRadius: 6, background: '#FEE2E2', color: '#DC2626', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
                        >
                          Reject
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={actionInProgress === t.id}
                        style={{ padding: '6px 8px', borderRadius: 6, background: '#F1F5F9', color: '#64748B', border: 'none', cursor: 'pointer' }}
                      >
                        <FiTrash2 size={12} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          )
        )}

        {/* Pagination */}
        {!loading && !error && templates.length > 0 && (
          <div style={{ marginTop: 'auto' }}>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {selectedTemplate && (
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }} 
            onClick={() => setSelectedTemplate(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              style={{ width: '90vw', maxWidth: 1200, height: '85vh', background: 'white', display: 'flex', borderRadius: 24, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Canvas Area */}
              <div style={{ flex: 1, height: '100%', background: '#F8FAFC', position: 'relative' }}>
                {loadingDetails ? (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-muted)' }}>
                    <div className="loading-spinner" />
                    <span style={{ fontSize: 13 }}>Loading workflow structure...</span>
                  </div>
                ) : templateDetails && templateDetails.config ? (
                  <div style={{ width: '100%', height: '100%' }}>
                    <ReactFlow
                      nodes={displayNodes}
                      edges={displayEdges}
                      nodeTypes={nodeTypes}
                      nodesDraggable={false}
                      nodesConnectable={false}
                      elementsSelectable={false}
                      panOnDrag={true}
                      zoomOnScroll={true}
                      fitView
                      fitViewOptions={{ padding: 0.35 }}
                      style={{ background: '#F8FAFC' }}
                    >
                      <Background variant="dots" gap={16} size={1} color="#CBD5E1" />
                      <Controls showInteractive={false} />
                    </ReactFlow>
                  </div>
                ) : (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 13 }}>
                    Structure not available
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div style={{ width: 380, borderLeft: '1px solid #EAEAEA', display: 'flex', flexDirection: 'column', padding: '32px', boxSizing: 'border-box', background: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Review Template</h2>
                  <button onClick={() => setSelectedTemplate(null)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: 4 }}>
                    <FiX size={20} />
                  </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Template Name</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1E1B4B' }}>{selectedTemplate.name}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Description</div>
                    <div style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.5 }}>{selectedTemplate.description || 'No description provided.'}</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Group</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1E1B4B' }}>{selectedTemplate.group}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Category</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1E1B4B' }}>{selectedTemplate.category}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Scope</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1E1B4B', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {getScopeIcon(selectedTemplate.scope)}
                        <span style={{ textTransform: 'capitalize' }}>{selectedTemplate.scope}</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Owner</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1E1B4B' }}>{selectedTemplate.owner}</div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Status</div>
                    <div style={{ marginTop: 4 }}>{getStatusBadge(selectedTemplate.status)}</div>
                  </div>
                </div>

                {/* Actions inside Modal */}
                <div style={{ borderTop: '1px solid #EAEAEA', paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {selectedTemplate.status !== 'approved' && (
                      <button
                        onClick={() => handleUpdateStatus(selectedTemplate.id, 'approved')}
                        disabled={actionInProgress === selectedTemplate.id}
                        style={{ flex: 1, padding: '12px', borderRadius: 8, background: '#10B981', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 700 }}
                      >
                        <FiCheck /> Approve Template
                      </button>
                    )}
                    {selectedTemplate.status !== 'rejected' && (
                      <button
                        onClick={() => handleUpdateStatus(selectedTemplate.id, 'rejected')}
                        disabled={actionInProgress === selectedTemplate.id}
                        style={{ flex: 1, padding: '12px', borderRadius: 8, background: '#EF4444', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 700 }}
                      >
                        <FiX /> Reject Template
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(selectedTemplate.id)}
                    disabled={actionInProgress === selectedTemplate.id}
                    style={{ padding: '12px', borderRadius: 8, background: '#F1F5F9', color: '#64748B', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 700 }}
                  >
                    <FiTrash2 /> Delete Template
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
