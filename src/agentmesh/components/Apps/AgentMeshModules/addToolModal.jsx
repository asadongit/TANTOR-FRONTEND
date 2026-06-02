import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiPlus, FiCpu, FiTool, FiUsers, FiSearch, FiCheck, FiLayers } from 'react-icons/fi';
import { useWorkflowStore, useUIStore } from '../../../store';

const NODE_ICONS = {
  llm_agent: FiCpu,
  deep_agent: FiCpu,
  tool_node: FiTool,
  supervisor: FiUsers,
  swarm: FiLayers
};

const NODE_LABELS = {
  llm_agent: 'Agent',
  deep_agent: 'Deep Agent',
  tool_node: 'Tool Node',
  supervisor: 'Supervisor',
  swarm: 'Swarm'
};

export default function AddToolModal({ isOpen, onClose, tool }) {
  const [search, setSearch] = useState('');
  const { nodes, addNode, setNodeData } = useWorkflowStore();
  const { setActivePage } = useUIStore();

  if (!isOpen || !tool) return null;

  // Filter ONLY for nodes that strictly support Tool assignments
  const compatibleNodes = nodes.filter(n => 
    ['llm_agent', 'deep_agent', 'tool_node', 'supervisor', 'swarm'].includes(n.data?.type) && 
    n.id !== '__start__' && n.id !== '__end__' &&
    (search === '' || (n.data?.label || n.id).toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreateNew = () => {
    setActivePage('canvas');
    const id = addNode('tool_node', { x: 400, y: 250 });
    setNodeData(id, {
      label: `${tool.display_name}`,
      tools: [tool.name]
    });
    onClose();
  };

  const handleAddToExisting = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const currentTools = node.data?.tools || [];
    if (currentTools.includes(tool.name)) return;

    setNodeData(nodeId, {
      tools: [...currentTools, tool.name]
    });
    
    setActivePage('canvas');
    onClose();
  };

  return (
    <AnimatePresence>
      <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: 'absolute', inset: 0, background: 'rgba(28, 28, 30, 0.4)', backdropFilter: 'blur(8px)' }} 
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          style={{
            position: 'relative', width: '100%', maxWidth: 480, background: 'white',
            borderRadius: 20, boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '85vh',
            border: '1px solid var(--border)'
          }}
        >
          {/* Header */}
          <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Add to Workflow</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                Integration: <span style={{ color: 'var(--theme-primary)', fontWeight: 600 }}>{tool.display_name}</span>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'var(--bg-primary)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><FiX size={18} /></button>
          </div>

          <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
            
            {/* Action: Create New Node using THEME PRIMARY */}
            <button
              onClick={handleCreateNew}
              style={{
                width: '100%', padding: '16px 20px', borderRadius: 14, background: 'var(--bg-primary)',
                border: '1px solid var(--theme-primary)', display: 'flex', alignItems: 'center', gap: 16,
                cursor: 'pointer', marginBottom: 24, textAlign: 'left', transition: 'all 0.2s',
                boxShadow: 'var(--theme-primary-glow)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--theme-primary-light)'; e.currentTarget.style.borderColor = 'var(--theme-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.borderColor = 'var(--theme-primary)'; }}
            >
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--theme-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <FiPlus size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Create New Tool Node</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Appends a fresh capability node to the canvas.</div>
              </div>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Select Target Node</div>
              <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
            </div>

            <div style={{ position: 'relative', marginBottom: 16 }}>
              <FiSearch style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
              <input 
                type="text" 
                placeholder="Search active nodes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ 
                  width: '100%', padding: '12px 16px 12px 42px', borderRadius: 12, 
                  border: '1px solid var(--border)', fontSize: 13, outline: 'none',
                  background: 'var(--bg-primary)'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {compatibleNodes.length === 0 ? (
                <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                  No compatible target nodes found in this workflow.
                </div>
              ) : (
                compatibleNodes.map(node => {
                  const Icon = NODE_ICONS[node.data?.type] || FiTool;
                  const isPresent = node.data?.tools?.includes(tool.name);
                  
                  return (
                    <button
                      key={node.id}
                      onClick={() => !isPresent && handleAddToExisting(node.id)}
                      disabled={isPresent}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 12, background: 'white',
                        border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 12,
                        cursor: isPresent ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.15s',
                        opacity: isPresent ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => { if(!isPresent) { e.currentTarget.style.borderColor = 'var(--theme-primary)'; e.currentTarget.style.background = 'var(--bg-primary)'; } }}
                      onMouseLeave={(e) => { if(!isPresent) { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.background = 'white'; } }}
                    >
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-primary)' }}>
                        <Icon size={16} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{node.data?.label || node.id}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(node.data?.type || '').replace('_', ' ').toUpperCase()} • {node.data?.tools?.length || 0} Tools</div>
                      </div>
                      {isPresent && <FiCheck size={16} color="var(--green)" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div style={{ padding: '16px 28px', background: 'var(--bg-primary)', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={onClose} className="btn-secondary" style={{ fontSize: 13 }}>Cancel</button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
