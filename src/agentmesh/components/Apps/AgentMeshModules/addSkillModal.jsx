import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiPlus, FiCpu, FiSearch, FiCheck } from 'react-icons/fi';
import { useWorkflowStore, useUIStore } from '../../../store';

export default function AddSkillModal({ isOpen, onClose, skill }) {
  const [search, setSearch] = useState('');
  const { nodes, addNode, setNodeData } = useWorkflowStore();
  const { setActivePage } = useUIStore();

  if (!isOpen || !skill) return null;

  // Filter ONLY for Deep Agent nodes in the active canvas
  const compatibleNodes = nodes.filter(n => 
    n.data?.type === 'deep_agent' && 
    n.id !== '__start__' && n.id !== '__end__' &&
    (search === '' || (n.data?.label || n.id).toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreateNew = () => {
    setActivePage('canvas');
    const id = addNode('deep_agent', { x: 400, y: 250 });
    setNodeData(id, {
      label: `Deep Agent`,
      skills: [skill.name]
    });
    onClose();
  };

  const handleAddToExisting = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const currentSkills = node.data?.skills || [];
    if (currentSkills.includes(skill.name)) return;

    setNodeData(nodeId, {
      skills: [...currentSkills, skill.name]
    });
    
    setActivePage('canvas');
    onClose();
  };

  return (
    <AnimatePresence>
      <div style={{ 
        position: 'fixed', 
        inset: 0, 
        zIndex: 10000, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: 20 
      }}>
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ 
            position: 'absolute', 
            inset: 0, 
            background: 'rgba(28, 28, 30, 0.4)', 
            backdropFilter: 'blur(8px)' 
          }} 
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          style={{
            position: 'relative', 
            width: '100%', 
            maxWidth: 480, 
            background: 'white',
            borderRadius: 20, 
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid var(--border-light)',
            overflow: 'hidden', 
            display: 'flex', 
            flexDirection: 'column', 
            maxHeight: '85vh',
            fontFamily: "'Google Sans','Roboto',sans-serif"
          }}
        >
          {/* Header */}
          <div style={{ 
            padding: '24px 28px', 
            borderBottom: '1px solid var(--border-light)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between' 
          }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Add Skill to Canvas</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                Skill: <span style={{ color: 'var(--theme-primary)', fontWeight: 600 }}>{skill.name}</span>
              </div>
            </div>
            <button 
              onClick={onClose} 
              style={{ 
                background: '#F1F5F9', 
                border: 'none', 
                borderRadius: 8, 
                padding: 6, 
                cursor: 'pointer', 
                color: '#64748B', 
                display: 'flex' 
              }}
            >
              <FiX size={18} />
            </button>
          </div>

          <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
            
            {/* Action: Create New Deep Agent */}
            <button
              onClick={handleCreateNew}
              style={{
                width: '100%', 
                padding: '16px 20px', 
                borderRadius: 14, 
                background: 'var(--bg-primary)',
                border: '1px solid var(--theme-primary)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 16,
                cursor: 'pointer', 
                marginBottom: 24, 
                textAlign: 'left', 
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { 
                e.currentTarget.style.background = 'var(--theme-primary-glow)'; 
              }}
              onMouseLeave={(e) => { 
                e.currentTarget.style.background = 'var(--bg-primary)'; 
              }}
            >
              <div style={{ 
                width: 42, 
                height: 42, 
                borderRadius: 10, 
                background: 'var(--theme-primary)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'white' 
              }}>
                <FiPlus size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Create New Deep Agent</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Add a new Deep Agent node equipped with this skill.</div>
              </div>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Select Target Deep Agent</div>
              <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
            </div>

            <div style={{ position: 'relative', marginBottom: 16 }}>
              <FiSearch style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
              <input 
                type="text" 
                placeholder="Search active Deep Agents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '12px 16px 12px 42px', 
                  borderRadius: 12, 
                  border: '1px solid var(--border)', 
                  fontSize: 13, 
                  outline: 'none',
                  background: 'var(--bg-primary)'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {compatibleNodes.length === 0 ? (
                <div style={{ padding: '30px 0', textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>
                  No active Deep Agent nodes found in this workflow.
                </div>
              ) : (
                compatibleNodes.map(node => {
                  const isPresent = (node.data?.skills || []).includes(skill.name);
                  
                  return (
                    <button
                      key={node.id}
                      onClick={() => !isPresent && handleAddToExisting(node.id)}
                      disabled={isPresent}
                      style={{
                        width: '100%', 
                        padding: '12px 14px', 
                        borderRadius: 12, 
                        background: 'white',
                        border: '1px solid var(--border)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 12,
                        cursor: isPresent ? 'default' : 'pointer', 
                        textAlign: 'left', 
                        transition: 'all 0.15s',
                        opacity: isPresent ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => { 
                        if (!isPresent) { 
                          e.currentTarget.style.borderColor = 'var(--theme-primary)'; 
                          e.currentTarget.style.background = 'var(--bg-primary)'; 
                        } 
                      }}
                      onMouseLeave={(e) => { 
                        if (!isPresent) { 
                          e.currentTarget.style.borderColor = 'var(--border)'; 
                          e.currentTarget.style.background = 'white'; 
                        } 
                      }}
                    >
                      <div style={{ 
                        width: 34, 
                        height: 34, 
                        borderRadius: 8, 
                        background: 'var(--theme-primary-glow)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: 'var(--theme-primary)' 
                      }}>
                        <FiCpu size={16} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{node.data?.label || node.id}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          Deep Agent • {(node.data?.skills || []).length} Skills
                        </div>
                      </div>
                      {isPresent && <FiCheck size={16} color="#10B981" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div style={{ 
            padding: '16px 28px', 
            background: '#F8FAFC', 
            borderTop: '1px solid var(--border-light)', 
            display: 'flex', 
            justifyContent: 'flex-end' 
          }}>
            <button 
              onClick={onClose} 
              style={{
                padding: '8px 16px',
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                background: 'white',
                color: '#475569',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

AddSkillModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  skill: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    content: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string)
  })
};
