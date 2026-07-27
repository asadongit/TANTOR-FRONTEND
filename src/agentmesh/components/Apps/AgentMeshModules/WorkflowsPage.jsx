import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useWorkflowStore, useUIStore } from '../../../store';
import { listWorkflows, deleteWorkflow, cloneWorkflow, dispatchScheduleAction, listWorkflowCategories, getWorkflow } from '../../../api/agentmesh';
import { FiSearch, FiRefreshCw, FiPlus, FiTrash2, FiGitBranch, FiCopy, FiDownload, FiArrowRight, FiPause, FiPlay, FiFolder, FiTag, FiChevronDown, FiChevronRight, FiEdit2, FiX, FiCheck, FiMoreHorizontal, FiZap, FiInfo } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmationModal from '../../Common/ConfirmationModal';
import Pagination from '../../Common/Pagination';
import toast from 'react-hot-toast';
import LibraryHeader from '../../Common/LibraryHeader';

const NODE_COLORS = {
  llm_agent: '#C9DEFF', tool_node: '#FFE4B8', router: '#E5D9FF',
  supervisor: '#C9F5E0', swarm: '#FFD9EE',
  rag_node: '#FFF3B8', subgraph: '#C9F5F5',
  textToAudio: '#FFE4E1',
};
const NODE_TEXT = {
  llm_agent: '#1A56DB', tool_node: '#B45309', router: '#7C3AED',
  supervisor: '#065F46', swarm: '#9D174D',
  rag_node: '#92400E', subgraph: '#065555',
  textToAudio: '#C71585',
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch (e) {
    return dateStr;
  }
};

function StatusDot({ active }) {
  return (
    <span style={{
      display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
      background: active ? '#34C759' : '#D4D4CC',
      boxShadow: active ? '0 0 0 2px rgba(52,199,89,0.2)' : 'none',
      flexShrink: 0,
    }} />
  );
}

function WorkflowListRow({ w, onOpen, onDelete, onClone, onExport, onPause, onResume, onEdit, isRunning, deleting, cloning }) {
  // config is NOT included in list responses (summary-only for perf).
  // Nodes array will be empty — node pills and count are hidden gracefully.
  const nodes = [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        background: 'white',
        border: '1px solid #F0F0EE',
        borderRadius: 12,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        transition: 'all 0.2s ease',
        cursor: 'pointer'
      }}
      onClick={() => onOpen(w)}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.06)';
        e.currentTarget.style.borderColor = '#E5E7EB';
        e.currentTarget.style.background = '#FAFBFC';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = '#F0F0EE';
        e.currentTarget.style.background = 'white';
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 8, background: w.is_active ? 'var(--theme-primary-glow)' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <FiGitBranch size={18} color={w.is_active ? 'var(--theme-primary)' : '#6B7280'} strokeWidth={1.5} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
          {w.name}
          {isRunning && <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: 'var(--accent-btn)', color: 'white', fontWeight: 500 }}>RUNNING</span>}
        </div>
        <div style={{ fontSize: 12, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{nodes.length} nodes</span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#D1D5DB' }} />
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiTag size={10} /> {w.category || 'General'}</span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#D1D5DB' }} />
          <span>{(w.description || 'No description').substring(0, 50)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button onClick={(e) => { e.stopPropagation(); onOpen(w); }} title="Open" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', color: '#6B7280', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#111827'} onMouseLeave={(e) => e.currentTarget.style.color = '#6B7280'}><FiArrowRight size={16} /></button>
        <button onClick={(e) => { e.stopPropagation(); onExport(w, e); }} title="Export" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', color: '#6B7280', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#111827'} onMouseLeave={(e) => e.currentTarget.style.color = '#6B7280'}><FiDownload size={16} /></button>
        <button onClick={(e) => { e.stopPropagation(); onClone(w.id); }} disabled={cloning === w.id} title="Clone" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', color: '#6B7280', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#111827'} onMouseLeave={(e) => e.currentTarget.style.color = '#6B7280'}>{cloning === w.id ? <div className="loading-spinner" style={{ width: 12, height: 12 }} /> : <FiCopy size={16} />}</button>
        {w.is_active ? (
          <button onClick={(e) => { e.stopPropagation(); onPause(w.id); }} title="Pause" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', color: '#6B7280', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#111827'} onMouseLeave={(e) => e.currentTarget.style.color = '#6B7280'}><FiPause size={16} /></button>
        ) : (
          <button onClick={(e) => { e.stopPropagation(); onResume(w.id); }} title="Resume" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', color: '#34C759', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#22C55E'} onMouseLeave={(e) => e.currentTarget.style.color = '#34C759'}><FiPlay size={16} /></button>
        )}
        <button onClick={(e) => { e.stopPropagation(); onEdit(w); }} title="View Details" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', color: '#6B7280', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#111827'} onMouseLeave={(e) => e.currentTarget.style.color = '#6B7280'}><FiInfo size={16} /></button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(w.id); }} disabled={deleting === w.id} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', color: '#EF4444', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#DC2626'} onMouseLeave={(e) => e.currentTarget.style.color = '#EF4444'}>{deleting === w.id ? <div className="loading-spinner" style={{ width: 12, height: 12 }} /> : <FiTrash2 size={16} />}</button>
      </div>

      {/* Direct Trigger Buttons for List View */}
      {nodes.some(n => n.type === 'button_trigger' || n.data?.type === 'button_trigger') && (
        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', marginRight: 12 }}>
          {nodes
            .filter(n => n.type === 'button_trigger' || n.data?.type === 'button_trigger')
            .map(n => (
              <button
                key={n.id}
                onClick={(e) => {
                  e.stopPropagation();
                  const currentWfId = useWorkflowStore.getState().workflowId;
                  if (currentWfId !== w.id) {
                    useRunStore.getState().reset(); // Reset only if switching workflows
                  }
                  useWorkflowStore.getState().loadWorkflowIntoEditor(w); // Load into editor without switching page
                  const ui = useUIStore.getState();
                  ui.setTargetNodeId(n.id);
                  ui.setInitialRunInput(n.data?.button_input || 'Start');
                  ui.setRunOpen(true);
                }}
                style={{
                  height: 32, padding: '0 12px', borderRadius: 8, background: 'var(--theme-primary)', border: 'none',
                  color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: '0 4px 10px rgba(142, 119, 187, 0.2)'
                }}
              >
                <FiZap size={12} /> {n.data?.button_label || n.data?.label || 'Run'}
              </button>
            ))
          }
        </div>
      )}
    </motion.div>
  );
}

WorkflowListRow.propTypes = {
  w: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
    description: PropTypes.string,
    is_active: PropTypes.bool,
    config: PropTypes.object,
    created_at: PropTypes.string,
    updated_at: PropTypes.string,
  }).isRequired,
  onOpen: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onClone: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  deleting: PropTypes.string,
  cloning: PropTypes.string,
};

function ActionDropdown({ actions, isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      style={{
        position: 'absolute', bottom: '100%', right: 0, marginBottom: 8,
        background: 'white', border: '1px solid #E5E7EB', borderRadius: 12,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', zIndex: 50,
        minWidth: 160, padding: '6px'
      }}
    >
      {actions.map((a, i) => (
        <button
          key={i}
          onClick={(e) => { e.stopPropagation(); a.onClick(); onClose(); }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 8, border: 'none', background: 'none',
            fontSize: 13, fontWeight: 500, color: a.variant === 'danger' ? '#EF4444' : '#374151',
            cursor: 'pointer', transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = a.variant === 'danger' ? '#FEF2F2' : '#F3F4F6'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
        >
          {a.icon} {a.label}
        </button>
      ))}
    </motion.div>
  );
}

function WorkflowCard({ w, onOpen, onDelete, onClone, onExport, onPause, onResume, onEdit, isRunning, deleting, cloning, idx }) {
  const [showMore, setShowMore] = useState(false);
  // config is NOT included in list responses (summary-only for perf).
  const nodes = [];
  const edges = [];

  const moreActions = [
    { label: 'Export JSON', icon: <FiDownload size={14} />, onClick: () => onExport(w, { stopPropagation: () => { } }) },
    { label: 'Clone', icon: <FiCopy size={14} />, onClick: () => onClone(w.id) },
    { label: 'Details', icon: <FiInfo size={14} />, onClick: () => onEdit(w) },
    { label: 'Delete', icon: <FiTrash2 size={14} />, onClick: () => onDelete(w.id, { stopPropagation: () => { } }), variant: 'danger' },
  ];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: idx * 0.05, ease: [0.23, 1, 0.32, 1] }}
      style={{
        background: 'white',
        border: '1px solid #F0F0EE',
        borderRadius: 24,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.02)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.05)';
        e.currentTarget.style.borderColor = '#E5E7EB';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.02)';
        e.currentTarget.style.borderColor = '#F0F0EE';
      }}
      onClick={() => onOpen(w)}
    >
      <div style={{ padding: '24px', flex: 1 }}>
        {/* Header: Icon + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: w.is_active ? 'var(--theme-primary-glow)' : '#F3F4F6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            color: w.is_active ? 'var(--theme-primary)' : '#6B7280'
          }}>
            <FiGitBranch size={24} strokeWidth={1.5} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 17,
              fontWeight: 600,
              color: '#111827',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 4
            }}>
              {w.name}
              {isRunning && (
                <span className="node-active-running" style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 4,
                  background: 'var(--accent-btn)', color: 'white',
                  animation: 'node-pulse 2s infinite'
                }}>
                  RUNNING
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4 }}>
                <FiTag size={10} /> {w.category || 'General'}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div style={{
          fontSize: 14,
          color: '#4B5563',
          lineHeight: 1.6,
          marginBottom: 16,
          minHeight: '2.8em',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {w.description || "Design and deploy multi-agent orchestration flows with precision."}
        </div>

        {/* Node preview Pills */}
        {nodes.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {nodes.slice(0, 3).map((n, i) => (
              <span key={i} style={{
                fontSize: 10, padding: '3px 8px', borderRadius: 20,
                background: '#F3F4F6',
                color: '#4B5563',
                fontWeight: 600,
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
              }}>
                {(n.type || '').replace(/_/g, ' ')}
              </span>
            ))}
            {nodes.length > 3 && (
              <span style={{ fontSize: 10, color: '#9CA3AF', alignSelf: 'center' }}>
                +{nodes.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer: Redesigned Actions */}
      <div style={{
        padding: '12px 16px',
        background: '#F9FAFB',
        borderTop: '1px solid #F3F4F6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 8,
        position: 'relative'
      }}>
        {/* Play/Pause */}
        {w.is_active ? (
          <button
            onClick={(e) => { e.stopPropagation(); onPause(w.id); }}
            title="Pause Schedule"
            style={{
              width: 36, height: 36, borderRadius: 8, border: '1px solid #E5E7EB',
              background: 'white', color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          >
            <FiPause size={16} />
          </button>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onResume(w.id); }}
            title="Resume Schedule"
            style={{
              width: 36, height: 36, borderRadius: 8, border: '1px solid #DCFCE7',
              background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#DCFCE7'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#F0FDF4'}
          >
            <FiPlay size={16} />
          </button>
        )}

        {/* Primary Action: Open (Restored Style) */}
        <button
          onClick={() => onOpen(w)}
          title="Open Workflow"
          style={{
            width: 36, height: 36, borderRadius: 8, border: '1px solid #E5E7EB',
            background: 'white', color: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
        >
          <FiArrowRight size={18} />
        </button>

        {/* Vertical Separator */}
        {nodes.some(n => n.type === 'button_trigger' || n.data?.type === 'button_trigger') && (
          <div style={{ width: 1, height: 20, background: '#E5E7EB', margin: '0 4px' }} />
        )}

        {/* Inline Quick Trigger Buttons */}
        {nodes
          .filter(n => n.type === 'button_trigger' || n.data?.type === 'button_trigger')
          .map(n => (
            <button
              key={n.id}
              onClick={(e) => {
                e.stopPropagation();
                const currentWfId = useWorkflowStore.getState().workflowId;
                if (currentWfId !== w.id) {
                  useRunStore.getState().reset(); // Reset only if switching workflows
                }
                useWorkflowStore.getState().loadWorkflowIntoEditor(w);
                const ui = useUIStore.getState();
                ui.setTargetNodeId(n.id);
                ui.setInitialRunInput(n.data?.button_input || 'Start');
                ui.setRunOpen(true);
              }}
              title={`Quick Run: ${n.data?.button_label || n.data?.label || 'Trigger'}`}
              style={{
                height: 36, padding: '0 14px', borderRadius: 8, border: '1px solid var(--theme-primary-glow)',
                background: 'var(--theme-primary-glow)', color: 'var(--theme-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--theme-primary)'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--theme-primary-glow)'; e.currentTarget.style.color = 'var(--theme-primary)'; }}
            >
              <FiZap size={13} /> {n.data?.button_label || n.data?.label || 'Run'}
            </button>
          ))
        }

        <div style={{ flex: 1 }} />

        {/* More Options */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setShowMore(!showMore); }}
            title="More Options"
            style={{
              width: 36, height: 36, borderRadius: 8, border: '1px solid #E5E7EB',
              background: 'white', color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          >
            <FiMoreHorizontal size={18} />
          </button>
          <ActionDropdown actions={moreActions} isOpen={showMore} onClose={() => setShowMore(false)} />
        </div>
      </div>
    </motion.div>
  );
}

WorkflowCard.propTypes = {
  w: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
    description: PropTypes.string,
    is_active: PropTypes.bool,
    config: PropTypes.object,
    node_count: PropTypes.number,
    created_at: PropTypes.string,
    updated_at: PropTypes.string,
  }).isRequired,
  onOpen: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onClone: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  deleting: PropTypes.string,
  cloning: PropTypes.string,
  idx: PropTypes.number.isRequired,
};

export default function WorkflowsPage() {
  const {
    workflows, setWorkflows, loadWorkflowIntoEditor, newWorkflow, setLoadingWorkflows, loadingWorkflows,
    listCurrentPage: currentPage, setListCurrentPage: setCurrentPage,
    listSearch: search, setListSearch: setSearch,
    listCategory: selectedCategory, setListCategory: setSelectedCategory,
    listGroup: selectedGroupFilter, setListGroup: setSelectedGroupFilter,
    listViewMode: viewMode, setListViewMode: setViewMode
  } = useWorkflowStore();

  const [deleting, setDeleting] = useState(null);
  const [cloning, setCloning] = useState(null);
  const [error, setError] = useState(null);

  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState(null);

  const [categories, setCategories] = useState([]);
  const [groups, setGroups] = useState(['All']);
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());
  // const [filterOpen, setFilterOpen] = useState(false);
  // const filterPanelRef = useRef(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWf, setEditingWf] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  // const [searchOpen, setSearchOpen] = useState(search?.length > 0);
  // const searchInputRef = useRef(null);

  // Pagination state
  const [officialCategories, setOfficialCategories] = useState([]);
  const [pageSize] = useState(12);
  const [totalWorkflows, setTotalWorkflows] = useState(0);

  const totalPages = Math.ceil(totalWorkflows / pageSize);

  const buildHierarchy = (filteredWorkflows) => {
    const root = { subgroups: {}, items: [] };
    filteredWorkflows.forEach(w => {
      const g = w.group || 'Default';
      const parts = g.split('/');
      let current = root;
      parts.forEach((part, idx) => {
        if (!current.subgroups[part]) {
          current.subgroups[part] = { subgroups: {}, items: [], path: parts.slice(0, idx + 1).join('/') };
        }
        current = current.subgroups[part];
        if (idx === parts.length - 1) current.items.push(w);
      });
    });
    return root;
  };

  const countItems = (node) => {
    let count = node.items.length;
    Object.values(node.subgroups).forEach(sub => {
      count += countItems(sub);
    });
    return count;
  };

  const load = async () => {
    setLoadingWorkflows(true); setError(null);
    try {
      // 1. Fetch official categories once if not loaded
      if (officialCategories.length === 0) {
        try {
          const catRes = await listWorkflowCategories();
          if (catRes.status === 'success') {
            setOfficialCategories(catRes.categories || []);
          }
        } catch (e) { console.error("Failed to load official categories:", e); }
      }

      // 2. Fetch workflows and unique filters
      const r = await listWorkflows({
        page: currentPage,
        limit: pageSize,
        group: selectedGroupFilter,
        category: selectedCategory,
        search: debouncedSearch
      });
      setWorkflows(r.workflows || []);
      setTotalWorkflows(r.total || 0);

      if (r.unique_groups) {
        setGroups(['All', ...r.unique_groups]);
      }

      // Merge official categories with unique ones for the filter to ensure everything is covered
      const uniqueCats = r.unique_categories || [];
      const mergedCats = Array.from(new Set(['All', ...uniqueCats, ...officialCategories]));
      setCategories(mergedCats);
    }
    catch (e) { setError(e.message); }
    finally { setLoadingWorkflows(false); }
  };

  const { refreshTrigger, setActivePage } = useUIStore();

  useEffect(() => {
    load();
  }, [refreshTrigger, currentPage, selectedCategory, selectedGroupFilter, debouncedSearch]);

  // Handle search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page strictly when filters or search change to avoid empty results
  useEffect(() => {
    const isFirstLoad = !debouncedSearch && selectedCategory === 'All' && selectedGroupFilter === 'All';
    if (!isFirstLoad) {
      setCurrentPage(1);
    }
  }, [selectedCategory, selectedGroupFilter, debouncedSearch]);


  // Cleaned up old filter/search handlers (now managed inside LibraryHeader)

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    setWorkflowToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!workflowToDelete) return;
    setDeleting(workflowToDelete);
    try {
      await deleteWorkflow(workflowToDelete);
      setWorkflows(workflows.filter((w) => w.id !== workflowToDelete));
      // If the deleted workflow is currently open on the canvas, reset it
      const currentWorkflowId = useWorkflowStore.getState().workflowId;
      if (currentWorkflowId === workflowToDelete) {
        useWorkflowStore.getState().newWorkflow();
      }
    }
    catch (err) {
      if (err.status === 409) {
        toast.error(err.message);
      } else {
        toast.error('Delete failed: ' + (err.message || 'Unknown error'));
      }
    }
    finally {
      setDeleting(null);
      setWorkflowToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  const handlePause = async (id) => {
    try {
      await dispatchScheduleAction(id, 'pause');
      load();
    } catch (err) { alert('Pause failed: ' + err.message); }
  };

  const handleResume = async (id) => {
    try {
      await dispatchScheduleAction(id, 'resume');
      load();
    } catch (err) { alert('Resume failed: ' + err.message); }
  };

  const handleClone = async (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setCloning(id);
    try {
      await cloneWorkflow(id);
      await load(); // Reload list to show the new clone
    }
    catch (err) { alert('Clone failed: ' + err.message); }
    finally { setCloning(null); }
  };

  const handleExport = async (w, e) => {
    e.stopPropagation();
    try {
      // Fetch full config on demand — not available in summary list response
      const { getWorkflow } = await import('../../../api/agentmesh');
      const full = await getWorkflow(w.id);
      const config = full?.config;
      if (!config) throw new Error('No config found for this workflow');
      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(w.name || 'workflow').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  };

  const handleEdit = (w) => {
    setEditingWf({ ...w });
    setIsEditing(false);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (updatedWf) => {
    try {
      // Fetch the full config from backend since list response no longer includes it
      const { saveWorkflow } = await import('../../../api/agentmesh');
      const full = await getWorkflow(updatedWf.id);
      const config = {
        ...full.config,
        name: updatedWf.name,
        description: updatedWf.description,
        group: updatedWf.group,
        category: updatedWf.category,
        warmup: updatedWf.warmup ?? false,
      };
      await saveWorkflow(config);
      setWorkflows(workflows.map(w => w.id === updatedWf.id
        ? { ...w, name: updatedWf.name, description: updatedWf.description, group: updatedWf.group, category: updatedWf.category, warmup: updatedWf.warmup ?? false }
        : w
      ));
      setShowEditModal(false);
      load();
    } catch (err) {
      if (err.status === 409) {
        toast.error(err.message);
      } else {
        toast.error('Save failed: ' + (err.message || 'Unknown error'));
      }
    }
  };

  const filtered = (workflows || []);

  const grouped = filtered.reduce((acc, w) => {
    const group = w.group || 'Default';
    if (!acc[group]) acc[group] = [];
    acc[group].push(w);
    return acc;
  }, {});

  const toggleGroup = (group) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(group)) newCollapsed.delete(group);
    else newCollapsed.add(group);
    setCollapsedGroups(newCollapsed);
  };


  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-primary)', fontFamily: "'Google Sans','Roboto',sans-serif" }}>
      <LibraryHeader
        title="Workflows"
        description="Orchestrate and coordinate multi-agent system graphs, state machines, and sequential pipeline flows."
        search={search}
        onSearchChange={setSearch}
        placeholder="Search workflows..."
        groups={groups}
        selectedGroup={selectedGroupFilter}
        onGroupChange={(val) => { setSelectedGroupFilter(val); setCurrentPage(1); }}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={(val) => { setSelectedCategory(val); setCurrentPage(1); }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={load}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px',
                background: 'var(--theme-primary-glow)', color: 'var(--theme-primary)', border: 'none', borderRadius: 8,
                fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.95)'}
              onMouseLeave={e => e.currentTarget.style.filter = 'none'}
            >
              <FiRefreshCw size={14} className={loadingWorkflows ? 'animate-spin' : ''} /> Refresh
            </button>
            <button
              onClick={() => {
                newWorkflow();
                setActivePage('canvas');
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '7px 16px',
                background: 'var(--theme-primary-glow)', color: 'var(--theme-primary)', border: 'none', borderRadius: 8,
                fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.95)'}
              onMouseLeave={e => e.currentTarget.style.filter = 'none'}
            >
              <FiPlus size={14} /> New Workflow
            </button>
          </div>
        }
      />

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column' }}>
        {loadingWorkflows && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 80, gap: 12, color: 'var(--text-muted)' }}>
            <div className="loading-spinner" /> <span style={{ fontSize: 14 }}>Loading…</span>
          </div>
        )}
        {error && (
          <div style={{ padding: '16px 20px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, color: '#DC2626', fontSize: 13 }}>{error}</div>
        )}
        {!loadingWorkflows && !error && filtered.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: '#F2F2EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiSearch size={24} color="#9898A6" strokeWidth={1.5} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)' }}>
              {search ? `No results for "${search}"` : 'No workflows yet'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {search ? 'Try a different search term or check filters.' : 'Create your first multi-agent workflow on the canvas.'}
            </div>
          </div>
        )}
        {Object.keys(buildHierarchy(filtered).subgroups).length === 0 && filtered.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
            {filtered.map((w, idx) => (
              <WorkflowCard key={w.id} w={w} idx={idx}
                onOpen={(wf) => { loadWorkflowIntoEditor(wf); setActivePage('canvas'); }}
                onDelete={handleDelete} onClone={handleClone} onExport={handleExport}
                onPause={handlePause} onResume={handleResume} onEdit={handleEdit}
                isRunning={false} deleting={deleting} cloning={cloning}
              />
            ))}
          </div>
        )}

        {(() => {
          const hierarchy = buildHierarchy(filtered);
          const renderSection = (node, name, depth = 0) => {
            const hasSub = Object.keys(node.subgroups).length > 0;
            const hasItems = node.items.length > 0;
            if (!hasSub && !hasItems) return null;

            return (
              <div key={name || 'root'} style={{ marginBottom: 24, paddingLeft: depth * 12 }}>
                {name && (
                  <button
                    onClick={() => toggleGroup(node.path)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer',
                      padding: '8px 0', width: '100%', borderBottom: '1px solid #F0F0EE', marginBottom: 16
                    }}
                  >
                    {collapsedGroups.has(node.path) ? <FiChevronRight size={16} color="#9CA3AF" /> : <FiChevronDown size={16} color="#9CA3AF" />}
                    <FiFolder size={16} color="#6B7280" />
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#4B5563' }}>{name}</span>
                    <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 400 }}>({countItems(node)})</span>
                  </button>
                )}

                {!collapsedGroups.has(node.path) && (
                  <>
                    {hasItems && (
                      viewMode === 'cards' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24, marginBottom: 20 }}>
                          {node.items.map((w, idx) => (
                            <WorkflowCard key={w.id} w={w} idx={idx}
                              onOpen={(wf) => { loadWorkflowIntoEditor(wf); setActivePage('canvas'); }}
                              onDelete={handleDelete} onClone={handleClone} onExport={handleExport}
                              onPause={handlePause} onResume={handleResume} onEdit={handleEdit}
                              isRunning={false} deleting={deleting} cloning={cloning}
                            />
                          ))}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                          {node.items.map((w) => (
                            <WorkflowListRow key={w.id} w={w}
                              onOpen={(wf) => { loadWorkflowIntoEditor(wf); setActivePage('canvas'); }}
                              onDelete={handleDelete} onClone={handleClone} onExport={handleExport}
                              onPause={handlePause} onResume={handleResume} onEdit={handleEdit}
                              isRunning={false} deleting={deleting} cloning={cloning}
                            />
                          ))}
                        </div>
                      )
                    )}
                    {Object.entries(node.subgroups).map(([subName, subNode]) => renderSection(subNode, subName, depth + 1))}
                  </>
                )}
              </div>
            );
          };
          return Object.entries(hierarchy.subgroups).map(([name, node]) => renderSection(node, name));
        })()}

        {/* Pagination Controls */}
        {!loadingWorkflows && !error && filtered.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(p) => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          />
        )}
      </div>
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setWorkflowToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Workflow"
        message="Are you sure you want to delete this workflow? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Edit/Details Metadata Modal */}
      <AnimatePresence>
        {showEditModal && editingWf && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            padding: 20
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{
                width: '100%', maxWidth: 500, background: 'white', borderRadius: 20,
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden'
              }}
            >
              <div style={{ padding: '24px 32px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>
                  {isEditing ? 'Edit Workflow Details' : 'Workflow Details'}
                </h3>
                <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#9CA3AF' }}><FiX size={20} /></button>
              </div>

              <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                {isEditing ? (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</label>
                      <input
                        type="text"
                        value={editingWf.name}
                        onChange={(e) => setEditingWf({ ...editingWf, name: e.target.value })}
                        style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 14, outline: 'none' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</label>
                      <textarea
                        rows={3}
                        value={editingWf.description}
                        onChange={(e) => setEditingWf({ ...editingWf, description: e.target.value })}
                        style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 14, outline: 'none', resize: 'none' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Group</label>
                        <input
                          list="group-options"
                          type="text"
                          value={editingWf.group || ''}
                          onChange={(e) => setEditingWf({ ...editingWf, group: e.target.value })}
                          placeholder="e.g. Default"
                          style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 14, outline: 'none' }}
                        />
                        <datalist id="group-options">
                          {groups.filter(g => g !== 'All').map(g => <option key={g} value={g} />)}
                        </datalist>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</label>
                        <select
                          value={editingWf.category || 'General'}
                          onChange={(e) => setEditingWf({ ...editingWf, category: e.target.value })}
                          style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 14, outline: 'none', background: 'white' }}
                        >
                          {officialCategories.length > 0 ? (
                            officialCategories.map(c => <option key={c} value={c}>{c}</option>)
                          ) : (
                            categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)
                          )}
                          {!officialCategories.includes('General') && !categories.includes('General') && <option value="General">General</option>}
                        </select>
                      </div>
                    </div>

                    {/* Warmup Toggle */}
                    <div style={{
                      padding: '14px 16px',
                      background: editingWf.warmup ? '#F0FDF4' : '#F8F9FA',
                      borderRadius: 12,
                      border: `1px solid ${editingWf.warmup ? '#BBF7D0' : '#F1F1F1'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      gap: 12,
                      transition: 'all 0.2s'
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>
                          Pre-warm on Startup
                        </div>
                        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2, lineHeight: 1.4 }}>
                          When ON, this workflow compiles at server start for zero cold-start latency.
                          Recommended for webhooks and scheduled workflows.
                        </div>
                      </div>
                      <button
                        onClick={() => setEditingWf(prev => ({ ...prev, warmup: !prev.warmup }))}
                        style={{
                          width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                          background: editingWf.warmup ? '#22C55E' : '#D1D5DB',
                          position: 'relative', flexShrink: 0, transition: 'background 0.2s'
                        }}
                        title={editingWf.warmup ? 'Click to disable pre-warm' : 'Click to enable pre-warm'}
                      >
                        <span style={{
                          position: 'absolute', top: 3,
                          left: editingWf.warmup ? 23 : 3,
                          width: 18, height: 18, borderRadius: '50%',
                          background: 'white',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          transition: 'left 0.2s'
                        }} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</span>
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{editingWf.name}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</span>
                      <span style={{ fontSize: 14, color: '#4B5563', lineHeight: 1.6 }}>{editingWf.description || 'No description provided.'}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Group</span>
                        <span style={{ fontSize: 14, color: '#4B5563' }}>{editingWf.group || 'Default'}</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</span>
                        <span style={{ fontSize: 14, color: '#4B5563' }}>{editingWf.category || 'General'}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pre-warm on Startup</span>
                      <div>
                        {editingWf.warmup ? (
                          <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: 6, background: '#DEF7EC', color: '#03543F', fontSize: 12, fontWeight: 600 }}>Enabled</span>
                        ) : (
                          <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: 6, background: '#F3F4F6', color: '#4B5563', fontSize: 12, fontWeight: 600 }}>Disabled</span>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Internal ID & Timestamps */}
                <div style={{
                  marginTop: 12, padding: '16px', background: '#F8F9FA', borderRadius: 12, border: '1px solid #F1F1F1',
                  display: 'flex', flexDirection: 'column', gap: 8
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>Workflow ID</span>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#6B7280' }}>{editingWf.id}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>Created At</span>
                    <span style={{ fontSize: 12, color: '#4B5563' }}>{formatDate(editingWf.created_at)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>Last Updated</span>
                    <span style={{ fontSize: 12, color: '#4B5563' }}>{formatDate(editingWf.updated_at)}</span>
                  </div>
                </div>
              </div>

              <div style={{ padding: '24px 32px', background: '#F9FAFB', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #E5E7EB', background: 'white', fontSize: 14, fontWeight: 600, color: '#4B5563', cursor: 'pointer' }}
                    >
                      Back
                    </button>
                    <button
                      onClick={() => handleSaveEdit(editingWf)}
                      style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#111827', fontSize: 14, fontWeight: 600, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      <FiCheck /> Save Changes
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setShowEditModal(false)}
                      style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #E5E7EB', background: 'white', fontSize: 14, fontWeight: 600, color: '#4B5563', cursor: 'pointer' }}
                    >
                      Close
                    </button>
                    <button
                      onClick={() => setIsEditing(true)}
                      style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#111827', fontSize: 14, fontWeight: 600, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      <FiEdit2 size={14} /> Edit Details
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
