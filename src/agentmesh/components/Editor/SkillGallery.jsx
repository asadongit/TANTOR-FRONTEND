import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiBookOpen, 
  FiArrowRight, 
  FiCheckCircle, 
  FiSearch, 
  FiCode, 
  FiBriefcase, 
  FiZap, 
  FiChevronLeft, 
  FiChevronRight, 
  FiTag 
} from 'react-icons/fi';
import { listAvailableSkills } from '../../api/agentmesh';
import { useWorkflowStore, useUIStore } from '../../store';

const THEME_ACCENT = '#8B5CF6';
const THEME_BORDER = '#E5E7EB';
const LIMIT = 5;

export default function SkillGallery({ isOpen, onClose }) {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const setNodeData = useWorkflowStore(s => s.setNodeData);
  const selectedNodeId = useUIStore(s => s.selectedNodeId);
  const nodes = useWorkflowStore(s => s.nodes);

  // Debounce search query to prevent excessive backend API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search change
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch paginated & searched skills from backend
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      listAvailableSkills({ page, limit: LIMIT, search: debouncedSearch })
        .then(res => {
          setSkills(res.skills || []);
          setTotal(res.total || 0);
        })
        .catch(err => {
          console.error("Error loading skills:", err);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, page, debouncedSearch]);

  const applySkill = (skill) => {
    if (!selectedNodeId) {
      alert("Please select a node on the canvas first.");
      return;
    }

    const targetNode = nodes.find(n => n.id === selectedNodeId);
    if (!targetNode || targetNode.data?.type !== 'deep_agent') {
      alert("The selected node is not a Deep Agent. Skills can only be applied to Deep Agent nodes.");
      return;
    }

    const currentSkills = targetNode.data?.skills || [];
    let newSkills;
    if (currentSkills.includes(skill.name)) {
      // Toggle off
      newSkills = currentSkills.filter(s => s !== skill.name);
    } else {
      // Toggle on
      newSkills = [...currentSkills, skill.name];
    }

    setNodeData(selectedNodeId, { skills: newSkills });
  };

  const totalPages = Math.ceil(total / LIMIT) || 1;

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', right: 0, top: 0, bottom: 0, width: 420,
      background: '#FAFBFC', borderLeft: `1px solid ${THEME_BORDER}`,
      zIndex: 5000, display: 'flex', flexDirection: 'column',
      boxShadow: '-10px 0 40px rgba(15, 23, 42, 0.08)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px', borderBottom: `1px solid ${THEME_BORDER}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#FFFFFF'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: '#F5F3FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME_ACCENT
          }}>
            <FiBookOpen size={18} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Skill Gallery</div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>Deep Agent Capabilities</div>
          </div>
        </div>
        <button onClick={onClose} style={{ 
          border: 'none', background: 'none', cursor: 'pointer', color: '#94A3B8',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8,
          borderRadius: '50%', transition: 'background-color 0.2s'
        }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F1F5F9'}
           onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
          <FiX size={18} />
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: '16px 20px', background: '#FFFFFF', borderBottom: `1px solid ${THEME_BORDER}` }}>
        <div style={{ position: 'relative' }}>
          <FiSearch style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search skills by name, SOP or tags..."
            style={{
              width: '100%', padding: '10px 10px 10px 38px', borderRadius: 10,
              border: `1px solid ${THEME_BORDER}`, fontSize: 13, outline: 'none',
              background: '#F8FAFC', color: '#334155', boxSizing: 'border-box',
              transition: 'border-color 0.2s, background-color 0.2s'
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = THEME_ACCENT;
              e.currentTarget.style.backgroundColor = '#FFFFFF';
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = THEME_BORDER;
              e.currentTarget.style.backgroundColor = '#F8FAFC';
            }}
          />
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 12, color: '#94A3B8' }}>
            <div style={{
              width: 24, height: 24, border: `2px solid #E2E8F0`, borderTopColor: THEME_ACCENT,
              borderRadius: '50%', animation: 'spin 0.8s linear infinite'
            }} />
            <div style={{ fontSize: 13, fontWeight: 500 }}>Loading skills...</div>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
            {skills.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                color: '#64748B',
                gap: 12,
                textAlign: 'center',
                minHeight: '200px'
              }}>
                <FiBookOpen size={40} style={{ opacity: 0.2, strokeWidth: 1.5 }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>No skills found</div>
                <div style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.5, maxWidth: 280 }}>
                  {search ? "No expertise SOPs match your search query." : "There are currently no expertise SOP skills available in your workspace."}
                </div>
              </div>
            ) : (
              skills.map(skill => {
                const isApplied = (nodes.find(n => n.id === selectedNodeId)?.data?.skills || []).includes(skill.name);
                return (
                  <motion.div
                    key={skill.id}
                    whileHover={{ y: -2, scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    style={{
                      padding: '16px 18px', borderRadius: 16, border: `1.5px solid ${isApplied ? THEME_ACCENT : '#E2E8F0'}`,
                      background: 'white', cursor: 'pointer', transition: 'border-color 0.2s, box-shadow 0.2s',
                      boxShadow: isApplied ? `0 8px 24px rgba(139, 92, 246, 0.12)` : '0 2px 8px rgba(0,0,0,0.02)',
                      position: 'relative', display: 'flex', flexDirection: 'column', gap: 12
                    }}
                    onClick={() => applySkill(skill)}
                  >
                    {isApplied && (
                      <div style={{ 
                        position: 'absolute', top: 14, right: 14, color: THEME_ACCENT,
                        display: 'flex', alignItems: 'center', gap: 4, background: '#F5F3FF',
                        padding: '4px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700
                      }}>
                        <FiCheckCircle size={12} />
                        <span>Applied</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 14 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 10, 
                        background: isApplied ? '#F5F3FF' : '#F1F5F9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        color: isApplied ? THEME_ACCENT : '#64748B', flexShrink: 0
                      }}>
                        {skill.id.includes('code') ? <FiCode size={18} /> : 
                         skill.id.includes('arch') ? <FiBriefcase size={18} /> : 
                         <FiZap size={18} />}
                      </div>
                      <div style={{ flex: 1, paddingRight: isApplied ? 60 : 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1E293B', textTransform: 'capitalize' }}>
                          {skill.name.replace(/-/g, ' ')}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 4, lineHeight: 1.4 }}>
                          {skill.description}
                        </div>
                      </div>
                    </div>

                    {/* Tags section */}
                    {skill.tags && skill.tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                        {skill.tags.map((tag, tIdx) => (
                          <div key={tIdx} style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '3px 8px', borderRadius: 6, fontSize: 9.5,
                            background: '#F1F5F9', color: '#475569', fontWeight: 600
                          }}>
                            <FiTag size={8} />
                            <span>{tag}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ 
                      marginTop: 2, paddingTop: 10, borderTop: '1px solid #F1F5F9',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500 }}>
                        Click to {isApplied ? 'remove' : 'apply'}
                      </span>
                      <FiArrowRight size={13} color={THEME_ACCENT} />
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div style={{ 
          padding: '12px 20px', 
          background: '#FFFFFF', 
          borderTop: `1px solid ${THEME_BORDER}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            style={{
              padding: '6px 12px',
              border: `1px solid ${THEME_BORDER}`,
              background: '#FFFFFF',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              color: page === 1 ? '#CBD5E1' : '#475569',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={e => { if (page !== 1) e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
          >
            <FiChevronLeft size={14} />
            <span>Prev</span>
          </button>
          
          <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
            Page {page} of {totalPages}
          </span>

          <button 
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            style={{
              padding: '6px 12px',
              border: `1px solid ${THEME_BORDER}`,
              background: '#FFFFFF',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              color: page >= totalPages ? '#CBD5E1' : '#475569',
              cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={e => { if (page < totalPages) e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
          >
            <span>Next</span>
            <FiChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Info Footer */}
      <div style={{ padding: '16px 20px', background: '#F8FAFC', borderTop: `1px solid ${THEME_BORDER}`, fontSize: 11, color: '#64748B', lineHeight: 1.4 }}>
        <p style={{ margin: 0 }}>Tip: Deploy specialized skills to override the base model logic with strict SOP guidelines.</p>
      </div>
    </div>
  );
}

// Minimal X icon fix
const FiX = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
