import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useWorkflowStore, useUIStore } from '../../../store';
import { listComponentTemplates, deleteComponentTemplate, listComponentTemplateFilters } from '../../../api/agentmesh';
import { NODE_TYPES } from '../../Editor/NodePalette';
import { FiX, FiTrash2, FiLayers } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Pagination from '../../Common/Pagination';
import ConfirmationModal from '../../Common/ConfirmationModal';
import LibraryHeader from '../../Common/LibraryHeader';
import LibraryCard from '../../Common/LibraryCard';
import LibraryListRow from '../../Common/LibraryListRow';

function getNodeDetails(type) {
  const found = NODE_TYPES.find(n => n.type === type);
  return found || { icon: FiLayers, label: type, desc: 'Custom configured node' };
}

function NodeTemplateCard({ t, onDetails, onDelete, onUse, idx }) {
  const details = getNodeDetails(t.type);
  const Icon = details.icon;

  const tags = [];
  if (details.label) tags.push({ label: details.label, type: 'Node Type' });
  if (t.group) tags.push({ label: t.group, type: 'Group' });
  if (t.category_name) tags.push({ label: t.category_name, type: 'Category' });

  const moreActions = [
    { label: 'Delete', icon: <FiTrash2 size={14} />, onClick: () => onDelete(t.id), variant: 'danger' },
  ];

  return (
    <LibraryCard
      icon={<Icon size={22} strokeWidth={2} />}
      title={t.name}
      description={t.description || details.desc}
      tags={tags}
      primaryAction={{ label: '+ Add', onClick: () => onUse(t) }}
      secondaryAction={{ label: 'Details', onClick: () => onDetails(t) }}
      moreActions={moreActions}
      idx={idx}
      onClick={() => onDetails(t)}
    />
  );
}

NodeTemplateCard.propTypes = {
  t: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    description: PropTypes.string,
    category_name: PropTypes.string,
    group: PropTypes.string
  }).isRequired,
  onDetails: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onUse: PropTypes.func.isRequired,
  idx: PropTypes.number.isRequired
};

function NodeListRow({ t, onDetails, onDelete, onUse, idx }) {
  const details = getNodeDetails(t.type);
  const Icon = details.icon;

  const tags = [];
  if (details.label) tags.push({ label: details.label, type: 'Node Type' });
  if (t.group) tags.push({ label: t.group, type: 'Group' });
  if (t.category_name) tags.push({ label: t.category_name, type: 'Category' });

  const moreActions = [
    { label: 'Delete', icon: <FiTrash2 size={14} />, onClick: () => onDelete(t.id), variant: 'danger' },
  ];

  return (
    <LibraryListRow
      icon={<Icon size={22} />}
      title={t.name}
      description={t.description || details.desc}
      tags={tags}
      primaryAction={{ label: '+ Add', onClick: () => onUse(t) }}
      secondaryAction={{ label: 'Details', onClick: () => onDetails(t) }}
      moreActions={moreActions}
      idx={idx}
      onClick={() => onDetails(t)}
    />
  );
}

NodeListRow.propTypes = {
  t: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    description: PropTypes.string,
    category_name: PropTypes.string,
    group: PropTypes.string
  }).isRequired,
  onDetails: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onUse: PropTypes.func.isRequired,
  idx: PropTypes.number.isRequired
};

function NodeDetailsModal({ template, onClose, onUse }) {
  const config = template.config || {};
  const details = getNodeDetails(template.type);
  const Icon = details.icon;

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
              <Icon size={20} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>{template.name}</div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>Custom {details.label} Node Configuration</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
            <FiX size={24} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {template.description && (
            <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, padding: '16px', background: '#F8FAFC', borderRadius: 12, border: '1px solid #F1F5F9' }}>
              {template.description}
            </div>
          )}

          <section>
            <h4 style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 10 }}>Raw Config Keys</h4>
            <div style={{ padding: 16, background: '#F8FAFC', borderRadius: 12, border: '1px solid #F1F5F9' }}>
              <div style={{ fontSize: 12, color: '#4B5563', fontFamily: 'monospace', maxHeight: 200, overflowY: 'auto' }}>
                <pre>{JSON.stringify(config, null, 2)}</pre>
              </div>
            </div>
          </section>
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

NodeDetailsModal.propTypes = {
  template: PropTypes.shape({
    name: PropTypes.string,
    type: PropTypes.string,
    description: PropTypes.string,
    config: PropTypes.object
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onUse: PropTypes.func.isRequired
};

export default function NodesPage() {
  const { nodes, setNodesDirty } = useWorkflowStore();
  const { refreshTrigger, setActivePage } = useUIStore();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('cards');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  const [groups, setGroups] = useState(['All']);
  const [categories, setCategories] = useState(['All']);
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [nodeTypes, setNodeTypes] = useState([{ value: 'All', label: 'All Types' }]);
  const [selectedNodeType, setSelectedNodeType] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const pageSize = 12;

  const instantiateGroupTemplate = (config, newPosition) => {
    const originalPos = config.position || { x: 0, y: 0 };
    const dx = newPosition.x - originalPos.x;
    const dy = newPosition.y - originalPos.y;

    const idMap = {};
    const internalNodes = (config.internal_nodes || []).map(n => {
      const oldId = n.id;
      const type = n.data?.type || 'node';
      const newId = `${type}_${Math.random().toString(36).substring(2, 7)}`;
      idMap[oldId] = newId;

      return {
        ...n,
        id: newId,
        position: {
          x: (n.position?.x ?? 0) + dx,
          y: (n.position?.y ?? 0) + dy
        },
        data: {
          ...n.data,
          id: newId
        }
      };
    });

    const mapEdges = (edges) => (edges || []).map(e => ({
      ...e,
      id: `e_${idMap[e.source] || e.source}_to_${idMap[e.target] || e.target}_${Math.random().toString(36).substring(2, 7)}`,
      source: idMap[e.source] || e.source,
      target: idMap[e.target] || e.target
    }));

    const internalEdges = mapEdges(config.internal_edges);
    const originalEdges = mapEdges(config.original_edges);

    return {
      ...config,
      internal_nodes: internalNodes,
      internal_edges: internalEdges,
      original_edges: originalEdges
    };
  };

  const handleUseTemplate = (template) => {
    let config = template.config || {};
    const type = template.type || 'llm_agent';
    const id = `${type}_${Math.random().toString(36).substring(2, 7)}`;
    
    const lastNode = nodes[nodes.length - 1];
    const position = lastNode 
      ? { x: lastNode.position.x + 60, y: lastNode.position.y + 60 }
      : { x: 350, y: 250 };

    if (type === 'group') {
      config = instantiateGroupTemplate(config, position);
    }

    const newNode = {
      id,
      type: 'agentNode',
      position,
      data: {
        ...config,
        id,
        type,
        label: template.name || config.label || template.name
      }
    };

    setNodesDirty([...nodes, newNode]);
    setActivePage('canvas');
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await listComponentTemplates({
        exclude_type: 'api_node',
        page: currentPage,
        limit: pageSize,
        search,
        group: selectedGroup === 'All' ? undefined : selectedGroup,
        category_name: selectedCategory === 'All' ? undefined : selectedCategory,
        type: selectedNodeType === 'All' ? undefined : selectedNodeType
      });
      setTemplates(res.templates || []);
      setTotal(res.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadFilters = async () => {
    try {
      const res = await listComponentTemplateFilters({ exclude_type: 'api_node' });
      setGroups(['All', ...(res.groups || [])]);
      setCategories(['All', ...(res.categories || []).map(c => c.name)]);
      
      const distinctTypes = res.types || [];
      const mappedTypes = [
        { value: 'All', label: 'All Types' },
        ...distinctTypes.map(t => ({
          value: t,
          label: getNodeDetails(t).label
        }))
      ];
      setNodeTypes(mappedTypes);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    load();
    loadFilters();
  }, [currentPage, search, selectedGroup, selectedCategory, selectedNodeType, refreshTrigger]);

  const handleDelete = async (id) => {
    try {
      await deleteComponentTemplate(id);
      load();
      loadFilters();
    } catch (e) {
      alert("Failed to delete node template: " + e.message);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      <LibraryHeader
        title="Node Library"
        description="Manage and reuse custom configurations for all types of workflow template nodes."
        search={search}
        onSearchChange={val => { setSearch(val); setCurrentPage(1); }}
        groups={groups}
        categories={categories}
        selectedGroup={selectedGroup}
        onGroupChange={val => { setSelectedGroup(val); setCurrentPage(1); }}
        selectedCategory={selectedCategory}
        onCategoryChange={val => { setSelectedCategory(val); setCurrentPage(1); }}
        nodeTypes={nodeTypes}
        selectedNodeType={selectedNodeType}
        onNodeTypeChange={val => { setSelectedNodeType(val); setCurrentPage(1); }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        placeholder="Search node templates..."
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
        {loading ? (
          <div style={{ height: '60%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ border: '3px solid #EDE9FE', borderTopColor: 'var(--theme-primary)', borderRadius: '50%', width: 32, height: 32, animation: 'spin 1s linear infinite' }} />
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
            <FiLayers size={48} strokeWidth={1} />
            <div style={{ fontSize: 14, fontWeight: 500, textAlign: 'center', maxWidth: 400 }}>
              No node templates found. Save configured nodes from the canvas to populate this list.
            </div>
          </div>
        ) : viewMode === 'cards' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {templates.map((t, idx) => (
              <NodeTemplateCard
                key={t.id}
                t={t}
                onDetails={setSelectedTemplate}
                onDelete={setConfirmDeleteId}
                onUse={handleUseTemplate}
                idx={idx}
              />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {templates.map((t, idx) => (
              <NodeListRow
                key={t.id}
                t={t}
                onDetails={setSelectedTemplate}
                onDelete={setConfirmDeleteId}
                onUse={handleUseTemplate}
                idx={idx}
              />
            ))}
          </div>
        )}
      </div>

      {total > pageSize && (
        <div style={{ padding: '16px 32px', borderTop: '1px solid var(--border-light)', background: 'white' }}>
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(total / pageSize)}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <AnimatePresence>
        {selectedTemplate && (
          <NodeDetailsModal
            template={selectedTemplate}
            onClose={() => setSelectedTemplate(null)}
            onUse={handleUseTemplate}
          />
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => { handleDelete(confirmDeleteId); setConfirmDeleteId(null); }}
        title="Delete Node Template"
        message="Are you sure you want to permanently delete this node template? It will be removed from your library."
        confirmText="Delete Template"
        variant="danger"
      />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
