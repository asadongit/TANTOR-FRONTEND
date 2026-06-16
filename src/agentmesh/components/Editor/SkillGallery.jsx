import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBookOpen, FiArrowRight, FiCheckCircle, FiSearch, FiCode, FiBriefcase, FiZap } from 'react-icons/fi';
import { listAvailableSkills } from '../../api/agentmesh';
import { useWorkflowStore, useUIStore } from '../../store';

const THEME_ACCENT = '#8B5CF6';
const THEME_BORDER = '#E5E7EB';

export default function SkillGallery({ isOpen, onClose }) {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const setNodeData = useWorkflowStore(s => s.setNodeData);
  const selectedNodeId = useUIStore(s => s.selectedNodeId);
  const nodes = useWorkflowStore(s => s.nodes);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      listAvailableSkills()
        .then(res => setSkills(res.skills || []))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

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
    // We don't close the gallery automatically to allow multi-selection
  };

  const filteredSkills = skills.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.description.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', right: 0, top: 0, bottom: 0, width: 400,
      background: 'white', borderLeft: `1px solid ${THEME_BORDER}`,
      zIndex: 5000, display: 'flex', flexDirection: 'column',
      boxShadow: '-10px 0 30px rgba(0,0,0,0.05)'
    }}>
      {/* Header */}
      <div style={{
        padding: '24px', borderBottom: `1px solid ${THEME_BORDER}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#F9FAFB'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FiBookOpen size={20} color={THEME_ACCENT} />
          <div style={{ fontSize: 16, fontWeight: 800 }}>Skill Gallery</div>
        </div>
        <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
          <FiX size={20} />
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: '20px' }}>
        <div style={{ position: 'relative' }}>
          <FiSearch style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search expertise SOPs..."
            style={{
              width: '100%', padding: '10px 10px 10px 38px', borderRadius: 10,
              border: `1px solid ${THEME_BORDER}`, fontSize: 13, outline: 'none'
            }}
          />
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px', display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Loading skills...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
            {filteredSkills.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                color: '#6B7280',
                gap: 12,
                textAlign: 'center',
                minHeight: '200px'
              }}>
                <FiBookOpen size={36} style={{ opacity: 0.3, strokeWidth: 1.5 }} />
                <div style={{ fontSize: 14, fontWeight: 700 }}>No skills found</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', lineHeight: 1.5 }}>
                  {search ? "No expertise SOPs match your search query." : "There are currently no expertise SOP skills available in your workspace."}
                </div>
              </div>
            ) : (
              filteredSkills.map(skill => {
                const isApplied = (nodes.find(n => n.id === selectedNodeId)?.data?.skills || []).includes(skill.name);
                return (
                  <motion.div
                    key={skill.id}
                    whileHover={{ y: -2 }}
                    style={{
                      padding: 20, borderRadius: 16, border: `1px solid ${isApplied ? THEME_ACCENT : THEME_BORDER}`,
                      background: 'white', cursor: 'pointer', transition: 'all 0.2s',
                      boxShadow: isApplied ? `0 0 15px ${THEME_ACCENT}20` : '0 4px 6px -1px rgba(0,0,0,0.02)',
                      position: 'relative'
                    }}
                    onClick={() => applySkill(skill)}
                  >
                    {isApplied && (
                      <div style={{ position: 'absolute', top: 12, right: 12, color: THEME_ACCENT }}>
                        <FiCheckCircle size={18} />
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 14 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, background: '#F5F3FF',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME_ACCENT
                      }}>
                        {skill.id.includes('code') ? <FiCode size={20} /> : 
                         skill.id.includes('arch') ? <FiBriefcase size={20} /> : 
                         <FiZap size={20} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1F2937' }}>{skill.name}</div>
                        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4, lineHeight: 1.4 }}>
                          {skill.description}
                        </div>
                      </div>
                    </div>
                    <div style={{ 
                      marginTop: 16, paddingTop: 16, borderTop: '1px solid #F3F4F6',
                      display: 'flex', justifyContent: 'flex-end', alignItems: 'center'
                    }}>
                      <FiArrowRight size={14} color={THEME_ACCENT} />
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: 20, background: '#F9FAFB', borderTop: `1px solid ${THEME_BORDER}`, fontSize: 11, color: '#4B5563' }}>
        <p style={{ margin: 0 }}>Tip: Deploy a skill to a Deep Agent to override its base logic with specialized SOP expertise.</p>
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
