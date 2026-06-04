import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLayout, FiSearch, FiRefreshCw, FiCopy, FiTag, FiUsers, FiGlobe, FiEyeOff, FiLayers, FiInfo, FiX, FiCheck, FiArrowRight, FiFilter } from 'react-icons/fi';
import {
  ReactFlow, Background, Controls
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import AgentNode from '../../Editor/Nodes/AgentNode';
import CardboardNode from '../../Editor/Nodes/CardboardNode';
import { useWorkflowStore, useUIStore } from '../../../store';
import { listWorkflowTemplates, cloneWorkflowTemplate, getWorkflow, getWorkflowTemplate } from '../../../api/agentmesh';
import Pagination from '../../Common/Pagination';

// Optimized SVG Minimap rendering to show actual flow structure on each card
function WorkflowMinimap({ nodes = [], edges = [] }) {
  if (!nodes || nodes.length === 0) {
    return (
      <div style={{ height: 130, background: '#F8FAFC', borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 11, borderBottom: '1px solid #F1F5F9' }}>
        <FiLayout size={20} style={{ marginRight: 6, opacity: 0.6 }} /> No layout preview
      </div>
    );
  }

  // Scale nodes to fit within viewBox padding
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

      {/* Draw edges (solid, realistic connecting lines) */}
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

      {/* Draw node blocks resembling actual WorkflowCanvas nodes */}
      {computedNodes.map(n => {
        const config = NODE_CONFIGS[n.type] || { bg: '#F1F5F9', color: '#64748B', label: (n.type || 'NODE').toUpperCase().slice(0, 10), type: 'Node' };
        const nodeW = 56;
        const nodeH = 20;
        const labelText = n.label || config.label;
        const truncatedLabel = labelText.length > 10 ? labelText.slice(0, 8) + '..' : labelText;

        return (
          <g key={n.id} transform={`translate(${n.pos.x - nodeW / 2}, ${n.pos.y - nodeH / 2})`}>
            {/* Main Node Box */}
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
            {/* Colored Icon Square Box */}
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
            {/* Colored Inner Dot (representing the icon) */}
            <circle
              cx="10"
              cy="10"
              r="2.5"
              fill={config.color}
            />
            {/* Node Title text */}
            <text
              x="20"
              y="10"
              fontSize="4.8"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
              fontWeight="800"
              fill="#111827"
              letterSpacing="-0.01em"
            >
              {truncatedLabel}
            </text>
            {/* Node Type Subtitle text */}
            <text
              x="20"
              y="15"
              fontSize="3.8"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
              fontWeight="600"
              fill="#9CA3AF"
              letterSpacing="0.01em"
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

  // Map system nodes (start/end)
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

  // Check if __start__ or __end__ are present or need to be added
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

  // Add triggers if present in triggers
  if (triggers.webhook) {
    if (!rfNodes.some(n => n.data?.type === 'webhook')) {
      rfNodes.push({
        id: 'webhook_preview',
        type: 'agentNode',
        position: systemPositions['webhook'] || { x: 50, y: 50 },
        data: { id: 'webhook_preview', type: 'webhook', label: 'Webhook', ...triggers.webhook }
      });
    }
  }
  if (triggers.cron) {
    if (!rfNodes.some(n => n.data?.type === 'cron')) {
      rfNodes.push({
        id: 'cron_preview',
        type: 'agentNode',
        position: systemPositions['cron'] || { x: 50, y: 120 },
        data: { id: 'cron_preview', type: 'cron', label: 'Cron', ...triggers.cron }
      });
    }
  }
  if (triggers.polling) {
    if (!rfNodes.some(n => n.data?.type === 'polling')) {
      rfNodes.push({
        id: 'polling_preview',
        type: 'agentNode',
        position: systemPositions['polling'] || { x: 50, y: 190 },
        data: { id: 'polling_preview', type: 'polling', label: 'Polling Trigger', ...triggers.polling }
      });
    }
  }

  // Add cardboards from frontendMeta
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

export default function TemplatesPage() {
  const { loadWorkflowIntoEditor } = useWorkflowStore();
  const { setActivePage } = useUIStore();

  const nodeTypes = React.useMemo(() => ({ 
    agentNode: AgentNode,
    cardboardNode: CardboardNode
  }), []);

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedScope, setSelectedScope] = useState('All');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('All');
  const [cloningId, setCloningId] = useState(null);
  
  // Modal details state
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateDetails, setTemplateDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [filterOpen, setFilterOpen] = useState(false);
  const filterPanelRef = useRef(null);
  const searchInputRef = useRef(null);

  const [categories, setCategories] = useState(['All']);
  const [groups, setGroups] = useState(['All']);
  
  // Pagination state
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
        search: debouncedSearch
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
  }, [currentPage, selectedCategory, selectedGroupFilter, selectedScope, debouncedSearch]);

  // Fetch full details of the template when a card is selected
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
        console.error("Failed to load template configuration graph:", e);
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchDetails();
  }, [selectedTemplate]);

  // Handle search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filters or search change
  useEffect(() => {
    const isFirstLoad = !debouncedSearch && selectedCategory === 'All' && selectedGroupFilter === 'All' && selectedScope === 'All';
    if (!isFirstLoad) {
      setCurrentPage(1);
    }
  }, [selectedCategory, selectedGroupFilter, selectedScope, debouncedSearch]);

  // Click outside filter panel
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

  const handleUseTemplate = async (templateId) => {
    setCloningId(templateId);
    try {
      const res = await cloneWorkflowTemplate(templateId);
      if (res.status === 'success' && res.workflow_id) {
        const fullWf = await getWorkflow(res.workflow_id);
        if (fullWf) {
          loadWorkflowIntoEditor(fullWf);
          setActivePage('canvas');
        }
      }
    } catch (e) {
      alert('Failed to use template: ' + e.message);
    } finally {
      setCloningId(null);
      setSelectedTemplate(null);
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
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>Workflow Templates</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Search bar collapsible */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', transition: 'all 0.2s', width: (searchOpen || search) ? 320 : 36 }}>
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

          {/* Refresh */}
          <button
            onClick={loadTemplates}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              background: 'var(--theme-primary-glow)', color: 'var(--theme-primary)', border: 'none', borderRadius: 8,
              fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <FiRefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>

          <div style={{ width: 1, height: 24, background: 'var(--border-light)', margin: '0 8px' }} />

          {/* Minimalist Filter Popover */}
          <div style={{ position: 'relative' }} ref={filterPanelRef}>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
                background: filterOpen ? '#111827' : 'white',
                color: filterOpen ? 'white' : '#111827',
                border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <FiFilter size={16} /> Filters
              {(selectedCategory !== 'All' || selectedGroupFilter !== 'All' || selectedScope !== 'All') && (
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', background: '#EF4444'
                }} />
              )}
            </button>

            <AnimatePresence>
              {filterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 260,
                    background: 'white', border: '1px solid #E5E7EB', borderRadius: 12,
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                    zIndex: 100, padding: 16
                  }}
                >
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>By Scope</div>
                    <select
                      value={selectedScope}
                      onChange={(e) => { setSelectedScope(e.target.value); setCurrentPage(1); }}
                      style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: 6, outline: 'none', fontSize: 13, background: 'white' }}
                    >
                      <option value="All">All Scopes</option>
                      <option value="private">Private</option>
                      <option value="member">Member</option>
                      <option value="public">Public</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>By Group</div>
                    <select
                      value={selectedGroupFilter}
                      onChange={(e) => { setSelectedGroupFilter(e.target.value); setCurrentPage(1); }}
                      style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: 6, outline: 'none', fontSize: 13, background: 'white' }}
                    >
                      <option value="All">All Groups</option>
                      {groups.filter(g => g !== 'All').map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>By Category</div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                      style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: 6, outline: 'none', fontSize: 13, background: 'white' }}
                    >
                      <option value="All">All Categories</option>
                      {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => { setSelectedCategory('All'); setSelectedGroupFilter('All'); setSelectedScope('All'); setCurrentPage(1); setSearch(''); }}
                      style={{ padding: '6px 10px', fontSize: 12, color: '#6B7280', border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      Reset All
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Grid Content */}
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
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              style={{ textAlign: 'center', background: 'white', padding: '48px 32px', borderRadius: 20, border: '1px dashed #CBD5E1', maxWidth: 440 }}
            >
              <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'var(--theme-primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--theme-primary)' }}>
                <FiLayout size={26} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1E1B4B', margin: '0 0 8px 0' }}>No Templates Found</h2>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                {search || selectedCategory !== 'All' || selectedGroupFilter !== 'All' || selectedScope !== 'All'
                  ? 'Try adjusting your search terms or filter configurations.'
                  : 'Try saving a workflow template from your editor action menu first.'}
              </p>
            </motion.div>
          </div>
        ) : (
          !loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24, marginBottom: 24 }}>
              {templates.map((t, idx) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
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
                  {/* Visual Node-Edge Map Preview Area */}
                  <WorkflowMinimap nodes={t.preview_nodes} edges={t.preview_edges} />

                  <div style={{ padding: 18, display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</h3>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <FiTag size={10} /> {t.category}
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: 12, color: '#4B5563', lineHeight: 1.4, margin: '0 0 12px 0', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {t.description || 'Pre-designed structural agent layout.'}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F3F4F6', paddingTop: 10 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {getScopeIcon(t.scope)} {t.scope}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUseTemplate(t.id); }}
                        disabled={cloningId === t.id}
                        style={{
                          height: 28, padding: '0 10px', borderRadius: 6, background: 'var(--theme-primary-glow)',
                          color: 'var(--theme-primary)', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--theme-primary)'; e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--theme-primary-glow)'; e.currentTarget.style.color = 'var(--theme-primary)'; }}
                      >
                        {cloningId === t.id ? 'Using...' : <><FiCopy size={11} /> Use</>}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        )}

        {/* Pagination Controls */}
        {!loading && !error && templates.length > 0 && (
          <div style={{ marginTop: 'auto' }}>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => { setCurrentPage(p); }}
            />
          </div>
        )}
      </div>

      {/* Interactive Read-Only Preview Modal */}
      <AnimatePresence>
        {selectedTemplate && (
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }} 
            onClick={() => setSelectedTemplate(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              style={{ 
                width: '90vw', 
                maxWidth: 1200, 
                height: '85vh', 
                background: 'white', 
                display: 'flex', 
                borderRadius: 24, 
                overflow: 'hidden', 
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' 
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Left Side: Interactive Read-only ReactFlow Workspace */}
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
                      defaultEdgeOptions={{
                        type: 'smoothstep',
                        animated: false,
                        style: { stroke: '#CBD5E1', strokeWidth: 1.5 },
                      }}
                      style={{ background: '#F8FAFC' }}
                    >
                      <Background variant="dots" gap={16} size={1} color="#CBD5E1" />
                      <Controls showInteractive={false} />
                    </ReactFlow>
                    
                    <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(255, 255, 255, 0.95)', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', pointerEvents: 'none' }}>
                      <FiInfo size={12} /> Read-only Interactive View
                    </div>
                  </div>
                ) : (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 13 }}>
                    Structure not available
                  </div>
                )}
              </div>

              {/* Right Side: Metadata Description & Details Panel */}
              <div style={{ width: 380, borderLeft: '1px solid #EAEAEA', display: 'flex', flexDirection: 'column', padding: '32px', boxSizing: 'border-box', background: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Template Details</h2>
                  <button onClick={() => setSelectedTemplate(null)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#111827'} onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}>
                    <FiX size={20} />
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 24 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--theme-primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-primary)', flexShrink: 0 }}>
                    <FiLayout size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>{selectedTemplate.name}</h3>
                    <span style={{ fontSize: 11, color: 'var(--theme-primary)', fontWeight: 700 }}>{selectedTemplate.category}</span>
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>Description</label>
                    <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0 }}>{selectedTemplate.description || 'No description provided.'}</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 }}>Group</label>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{selectedTemplate.group}</span>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 }}>Scope Visibility</label>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4, textTransform: 'capitalize' }}>
                        {getScopeIcon(selectedTemplate.scope)} {selectedTemplate.scope}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>Identity Owner</label>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#4B5563', fontFamily: 'monospace' }}>{selectedTemplate.owner}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleUseTemplate(selectedTemplate.id)}
                  disabled={cloningId === selectedTemplate.id || loadingDetails}
                  style={{
                    width: '100%', height: 44, background: 'var(--theme-primary)', color: 'white', border: 'none', borderRadius: 10,
                    fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 4px 14px rgba(124, 58, 237, 0.2)', transition: 'opacity 0.2s', marginTop: 'auto'
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  {cloningId === selectedTemplate.id ? 'Cloning to Workspace...' : <><FiCopy size={16} /> Clone into Canvas</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
