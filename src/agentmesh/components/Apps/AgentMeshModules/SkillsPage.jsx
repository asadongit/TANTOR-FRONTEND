import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { 
  FiBookOpen, FiPlus, FiTrash2, FiEdit, 
  FiX, FiCheck, FiLoader, FiAlertCircle, FiCpu
} from 'react-icons/fi';
import { listAvailableSkills, createSkill, deleteSkill, generateSkillSop } from '../../../api/agentmesh';
import AddSkillModal from './addSkillModal';
import ConfirmationModal from '../../Common/ConfirmationModal';
import { motion, AnimatePresence } from 'framer-motion';
import LibraryHeader from '../../Common/LibraryHeader';
import LibraryCard from '../../Common/LibraryCard';
import LibraryListRow from '../../Common/LibraryListRow';
import Pagination from '../../Common/Pagination';

function SkillCard({ skill, onDetails, onEdit, onDelete, onAddToCanvas, idx }) {
  const moreActions = [
    { label: 'Edit', icon: <FiEdit size={14} />, onClick: () => onEdit(skill) },
    { label: 'Delete', icon: <FiTrash2 size={14} />, onClick: () => onDelete(skill.id), variant: 'danger' },
  ];

  return (
    <LibraryCard
      icon={<FiBookOpen size={22} strokeWidth={2} />}
      title={skill.name.replace(/-/g, ' ')}
      description={skill.description}
      tags={(skill.tags || []).map(t => ({ label: t, type: 'Tag' }))}
      primaryAction={{ label: '+ Add', onClick: () => onAddToCanvas(skill) }}
      secondaryAction={{ label: 'SOP', onClick: () => onDetails(skill) }}
      moreActions={moreActions}
      idx={idx}
      onClick={() => onDetails(skill)}
    />
  );
}

SkillCard.propTypes = {
  skill: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  onDetails: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onAddToCanvas: PropTypes.func.isRequired,
  idx: PropTypes.number.isRequired
};

function SkillListRow({ skill, onDetails, onEdit, onDelete, onAddToCanvas, idx }) {
  const moreActions = [
    { label: 'Edit', icon: <FiEdit size={14} />, onClick: () => onEdit(skill) },
    { label: 'Delete', icon: <FiTrash2 size={14} />, onClick: () => onDelete(skill.id), variant: 'danger' },
  ];

  return (
    <LibraryListRow
      icon={<FiBookOpen size={22} />}
      title={skill.name.replace(/-/g, ' ')}
      description={skill.description}
      tags={(skill.tags || []).map(t => ({ label: t, type: 'Tag' }))}
      primaryAction={{ label: '+ Add', onClick: () => onAddToCanvas(skill) }}
      secondaryAction={{ label: 'SOP', onClick: () => onDetails(skill) }}
      moreActions={moreActions}
      idx={idx}
      onClick={() => onDetails(skill)}
    />
  );
}

SkillListRow.propTypes = {
  skill: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  onDetails: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onAddToCanvas: PropTypes.func.isRequired,
  idx: PropTypes.number.isRequired
};

function SkillDetailsModal({ skill, onClose, onAddToCanvas }) {
  if (!skill) return null;

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
              <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', textTransform: 'capitalize' }}>{skill.name.replace(/-/g, ' ')}</div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>Skill Standard Operating Procedure (SOP)</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
            <FiX size={24} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {skill.description && (
            <section>
              <h4 style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6 }}>Description</h4>
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                {skill.description}
              </div>
            </section>
          )}

          <section>
            <h4 style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 10 }}>SOP Document (Markdown)</h4>
            <pre style={{
              margin: 0,
              padding: '20px',
              background: '#0F172A',
              color: '#E2E8F0',
              borderRadius: 8,
              fontSize: 13,
              fontFamily: 'Roboto Mono, monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              lineHeight: '1.6',
              overflowX: 'auto',
              border: '1px solid #1E293B'
            }}>
              {skill.content}
            </pre>
          </section>
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
              onAddToCanvas(skill);
            }}
            style={{ 
              padding: '10px 24px', background: 'var(--theme-primary-glow)', color: 'var(--theme-primary)', 
              border: '1px solid var(--theme-primary-glow)', borderRadius: 10, fontSize: 13, 
              fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' 
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--theme-primary)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--theme-primary-glow)'; e.currentTarget.style.color = 'var(--theme-primary)'; }}
          >
            Use Skill
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function SkillsPage() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 12;

  const [selectedSkill, setSelectedSkill] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddCanvasOpen, setIsAddCanvasOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState(null);
  const [viewMode, setViewMode] = useState('cards');

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    content: '',
    tags: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Validation helper
  const validateSkillForm = (data) => {
    const errors = {};
    const name = data.name.trim();
    const desc = data.description.trim();

    // Name rules
    if (!name) {
      errors.name = 'Name is required.';
    } else if (name.length > 64) {
      errors.name = 'Name must be 64 characters or fewer.';
    } else if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(name)) {
      if (/[A-Z]/.test(name)) {
        errors.name = 'Uppercase letters are not allowed. Use lowercase only.';
      } else if (name.startsWith('-') || name.endsWith('-')) {
        errors.name = 'Name must not start or end with a hyphen.';
      } else if (/--/.test(name)) {
        errors.name = 'Consecutive hyphens (--) are not allowed.';
      } else if (!/^[a-z0-9-]+$/.test(name)) {
        errors.name = 'Only lowercase letters (a-z), digits (0-9), and hyphens (-) are allowed.';
      } else {
        errors.name = 'Invalid name format. Use lowercase alphanumeric characters and hyphens only.';
      }
    }

    // Description rules
    if (!desc) {
      errors.description = 'Description is required.';
    } else if (desc.length > 1024) {
      errors.description = 'Description must be 1024 characters or fewer.';
    } else if (desc.length < 20) {
      errors.description = 'Description is too short. Describe what the skill does and when to use it (min 20 chars).';
    }

    return errors;
  };

  // Keydown listener for 's' keyboard shortcut
  // (Optional keydown search trigger can be added if desired, keeping clean for now)

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const data = await listAvailableSkills({
        page: currentPage,
        limit: pageSize,
        search: searchQuery
      });
      if (data?.skills) {
        setSkills(data.skills);
        setTotal(data.total || 0);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching skills:', err);
      setError('Failed to load skills from the database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, [currentPage, searchQuery]);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormData({
      id: '',
      name: '',
      description: '',
      content: `# New Skill SOP\n\nUse this skill to perform specific actions.\n\n## Standard Operating Procedure\n- Step 1\n- Step 2`,
      tags: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (skill) => {
    setIsEditing(true);
    setFormData({
      id: skill.id,
      name: skill.name,
      description: skill.description || '',
      content: skill.content || '',
      tags: (skill.tags || []).join(', ')
    });
    setIsModalOpen(true);
  };

  const handleDelete = (skillId) => {
    setSkillToDelete(skillId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!skillToDelete) return;
    try {
      await deleteSkill(skillToDelete);
      fetchSkills();
      if (selectedSkill && selectedSkill.id === skillToDelete) {
        setSelectedSkill(null);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete skill.');
    } finally {
      setSkillToDelete(null);
      setShowDeleteConfirm(false);
    }
  };
  const [generatingSop, setGeneratingSop] = useState(false);

  const handleGenerateSOPWithArchitect = async () => {
    if (!formData.name) return;
    setGeneratingSop(true);
    try {
      const cachedProvider = localStorage.getItem('architect_provider') || 'groq';
      const cachedModel = localStorage.getItem('architect_model') || 'llama-3.3-70b-versatile';
      const cachedTemp = localStorage.getItem('architect_temperature') || '0.2';
      const cachedKey = localStorage.getItem('architect_api_key') || '';
      const payload = {
        name: formData.name,
        description: formData.description,
        tags: formData.tags,
        llm: {
          provider: cachedProvider,
          model: cachedModel,
          temperature: parseFloat(cachedTemp),
          api_key_override: cachedKey
        }
      };
      const res = await generateSkillSop(payload);
      if (res.status === 'success' && res.sop) {
        setFormData(prev => ({ ...prev, content: res.sop }));
      } else {
        alert(res.message || 'Failed to generate SOP using Architect.');
      }
    } catch (err) {
      alert(err.message || 'An error occurred during generation.');
    } finally {
      setGeneratingSop(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateSkillForm(formData);
    if (!formData.content.trim()) errors.content = 'SOP content is required.';
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    setSubmitting(true);
    try {
      const tagsArray = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const payload = {
        name: formData.name.trim().toLowerCase().replace(/\s+/g, '-'),
        description: formData.description.trim(),
        content: formData.content,
        tags: tagsArray
      };

      const result = await createSkill(payload);
      if (result?.skill) {
        const savedSkill = result.skill;
        fetchSkills();
        setSelectedSkill(savedSkill);
        setIsModalOpen(false);
      }
    } catch (err) {
      alert(err.message || 'Failed to save skill.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSkills = skills;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-primary)',
      fontFamily: "'Google Sans','Roboto',sans-serif",
      overflow: 'hidden'
    }}>
      <LibraryHeader
        title="Skills"
        description="Define and refine Standard Operating Procedures (SOPs) that guide agent execution behaviors."
        search={searchQuery}
        onSearchChange={val => { setSearchQuery(val); setCurrentPage(1); }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showFilters={false}
        placeholder="Search skills..."
        actions={
          <button
            type="button"
            onClick={handleOpenCreate}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              background: 'var(--theme-primary-glow)',
              color: 'var(--theme-primary)',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--theme-primary)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--theme-primary-glow)';
              e.currentTarget.style.color = 'var(--theme-primary)';
            }}
          >
            <FiPlus strokeWidth={2.5} /> Add Skill
          </button>
        }
      />

      {/* Main Panel (Grid of Cards) */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '32px'
      }}>
        {loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            minHeight: '300px',
            color: '#64748B',
            gap: 12
          }}>
            <FiLoader className="animate-spin" size={24} style={{ color: 'var(--theme-primary)' }} />
            <span style={{ fontSize: 13 }}>Loading skills...</span>
          </div>
        ) : error ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            textAlign: 'center',
            color: '#EF4444',
            gap: 8
          }}>
            <FiAlertCircle size={28} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>{error}</span>
          </div>
        ) : filteredSkills.length === 0 ? (
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
            <FiBookOpen size={48} strokeWidth={1} />
            <div style={{ fontSize: 14, fontWeight: 500 }}>No skills found</div>
          </div>
        ) : viewMode === 'cards' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 24
          }}>
            {filteredSkills.map((skill, idx) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                idx={idx}
                onDetails={setSelectedSkill}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
                onAddToCanvas={(s) => {
                  setSelectedSkill(s);
                  setIsAddCanvasOpen(true);
                }}
              />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredSkills.map((skill, idx) => (
              <SkillListRow
                key={skill.id}
                skill={skill}
                idx={idx}
                onDetails={setSelectedSkill}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
                onAddToCanvas={(s) => {
                  setSelectedSkill(s);
                  setIsAddCanvasOpen(true);
                }}
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

      {/* Modern Modal dialog */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'white',
            width: '100%',
            maxWidth: 680,
            borderRadius: 16,
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 28px',
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#FAFAFA'
            }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0F172A' }}>
                {isEditing ? 'Edit Skill SOP' : 'Add New Skill SOP'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: '#94A3B8',
                  padding: 4
                }}
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} style={{
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              flex: 1
            }}>
              <div style={{
                padding: '24px 28px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 18
              }}>
                {/* Skill Name */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Skill Key Name <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isEditing}
                    placeholder="e.g. pdf-processing, data-analysis"
                    value={formData.name}
                    onChange={e => {
                      // Sanitize: lowercase, replace spaces/underscores/invalid chars with hyphen,
                      // collapse consecutive hyphens, strip leading hyphens
                      let val = e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, '-')   // only allow a-z, 0-9, hyphen
                        .replace(/-{2,}/g, '-')          // collapse consecutive hyphens
                        .replace(/^-+/, '');             // strip leading hyphens
                      setFormData({ ...formData, name: val });
                      if (formErrors.name) {
                        const errs = validateSkillForm({ ...formData, name: val });
                        setFormErrors(prev => ({ ...prev, name: errs.name }));
                      }
                    }}
                    onBlur={() => {
                      const errs = validateSkillForm(formData);
                      setFormErrors(prev => ({ ...prev, name: errs.name }));
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: `1px solid ${formErrors.name ? '#EF4444' : '#D1D5DB'}`,
                      borderRadius: 8,
                      fontSize: 14,
                      outline: 'none',
                      background: isEditing ? '#F3F4F6' : 'white',
                      boxSizing: 'border-box'
                    }}
                  />
                  {formErrors.name ? (
                    <div style={{ marginTop: 5, fontSize: 12, color: '#EF4444', display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                      <FiAlertCircle size={13} style={{ marginTop: 1, flexShrink: 0 }} />
                      {formErrors.name}
                    </div>
                  ) : (
                    <div style={{ marginTop: 5, fontSize: 11, color: '#94A3B8' }}>
                      1–64 chars · lowercase letters, digits and hyphens only · no leading/trailing/consecutive hyphens
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                      Description <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <span style={{ fontSize: 11, color: formData.description.length > 1024 ? '#EF4444' : '#94A3B8' }}>
                      {formData.description.length}/1024
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Describe what this skill does and when an agent should use it. Include keywords relevant to the task."
                    value={formData.description}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData({ ...formData, description: val });
                      if (formErrors.description) {
                        const errs = validateSkillForm({ ...formData, description: val });
                        setFormErrors(prev => ({ ...prev, description: errs.description }));
                      }
                    }}
                    onBlur={() => {
                      const errs = validateSkillForm(formData);
                      setFormErrors(prev => ({ ...prev, description: errs.description }));
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: `1px solid ${formErrors.description ? '#EF4444' : '#D1D5DB'}`,
                      borderRadius: 8,
                      fontSize: 13.5,
                      outline: 'none',
                      resize: 'vertical',
                      lineHeight: '1.5',
                      fontFamily: "inherit",
                      boxSizing: 'border-box'
                    }}
                  />
                  {formErrors.description ? (
                    <div style={{ marginTop: 5, fontSize: 12, color: '#EF4444', display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                      <FiAlertCircle size={13} style={{ marginTop: 1, flexShrink: 0 }} />
                      {formErrors.description}
                    </div>
                  ) : (
                    <div style={{ marginTop: 5, fontSize: 11, color: '#94A3B8' }}>
                      Describe what it does and when to use it. Include specific keywords for agent task matching.
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. coding, optimization, clean-code"
                    value={formData.tags}
                    onChange={e => setFormData({ ...formData, tags: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #D1D5DB',
                      borderRadius: 8,
                      fontSize: 14,
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Markdown SOP Content */}
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 250 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                      SOP Markdown Content
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateSOPWithArchitect}
                      disabled={generatingSop || !formData.name}
                      style={{
                        background: 'white',
                        border: '1px solid #D1D5DB',
                        borderRadius: 6,
                        padding: '4px 8px',
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--theme-primary)',
                        cursor: (!formData.name || generatingSop) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'all 0.2s',
                        opacity: (!formData.name || generatingSop) ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (formData.name && !generatingSop) {
                          e.currentTarget.style.background = 'var(--theme-primary-glow)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (formData.name && !generatingSop) {
                          e.currentTarget.style.background = 'white';
                        }
                      }}
                    >
                      {generatingSop ? (
                        <>
                          <FiLoader className="animate-spin" size={12} /> Generating...
                        </>
                      ) : (
                        <>
                          <FiCpu size={12} /> Architect Wizard
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    required
                    placeholder="# SOP Title\n\nExplain how the Deep Agent should use this skill..."
                    value={formData.content}
                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                    style={{
                      width: '100%',
                      flex: 1,
                      padding: '12px 14px',
                      border: '1px solid #D1D5DB',
                      borderRadius: 8,
                      fontSize: 13.5,
                      fontFamily: 'Fira Code, Courier New, monospace',
                      outline: 'none',
                      resize: 'none',
                      lineHeight: '1.5'
                    }}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '16px 28px',
                borderTop: '1px solid var(--border-light)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 12,
                background: '#FAFAFA'
              }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '9px 16px',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    background: 'white',
                    color: 'var(--text-secondary)',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '9px 20px',
                    border: 'none',
                    borderRadius: 8,
                    background: 'var(--theme-primary-glow)',
                    color: 'var(--theme-primary)',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--theme-primary)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--theme-primary-glow)';
                    e.currentTarget.style.color = 'var(--theme-primary)';
                  }}
                >
                  {submitting ? (
                    <>
                      <FiLoader className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <FiCheck strokeWidth={2.5} /> Save Skill
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedSkill && !isAddCanvasOpen && !isModalOpen && (
          <SkillDetailsModal
            skill={selectedSkill}
            onClose={() => setSelectedSkill(null)}
            onAddToCanvas={(s) => {
              setSelectedSkill(s);
              setIsAddCanvasOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      <AddSkillModal
        isOpen={isAddCanvasOpen}
        onClose={() => {
          setIsAddCanvasOpen(false);
          setSelectedSkill(null);
        }}
        skill={selectedSkill}
      />

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSkillToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Skill"
        message="Are you sure you want to delete this skill? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
