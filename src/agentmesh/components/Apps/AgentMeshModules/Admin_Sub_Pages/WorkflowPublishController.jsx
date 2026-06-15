import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiGitBranch, FiClock, FiCheckCircle, FiSearch, FiRefreshCw, FiTag, 
  FiFilter, FiX, FiCheck, FiTrash2, FiMessageSquare, FiGrid, FiList,
  FiPlay, FiPause, FiArrowRight, FiInfo, FiMoreHorizontal, FiFolder
} from 'react-icons/fi';
import { 
  listMarketplaceUsecases, 
  updateMarketplaceUsecaseStatus, 
  deleteMarketplaceUsecase,
  getWorkflow,
  dispatchScheduleAction
} from '../../../../api/agentmesh';
import { useWorkflowStore, useUIStore } from '../../../../store';
import Pagination from '../../../Common/Pagination';
import PageHeader from '../../../Common/PageHeader';

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
        minWidth: 140, padding: '6px'
      }}
    >
      {actions.map((a, i) => (
        <button
          key={i}
          onClick={(e) => { e.stopPropagation(); a.onClick(); onClose(); }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', borderRadius: 8, border: 'none', background: 'none',
            fontSize: 12, fontWeight: 500, color: a.variant === 'danger' ? '#EF4444' : '#374151',
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

function PublishRequestCard({ u, idx, handlePause, handleResume, handleOpenWorkflow, handleUpdateStatus, setShowRemarksModal, setShowDetailsModal, handleDelete, actionInProgress, getStatusBadge }) {
  const [showMore, setShowMore] = useState(false);

  const moreActions = [
    { label: 'Details', icon: <FiInfo size={14} />, onClick: () => setShowDetailsModal(u) },
    { label: 'Delete', icon: <FiTrash2 size={14} />, onClick: () => handleDelete(u.id), variant: 'danger' },
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
      onClick={() => setShowDetailsModal(u)}
    >
      <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: u.is_active ? 'var(--theme-primary-glow)' : '#F3F4F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: u.is_active ? 'var(--theme-primary)' : '#6B7280'
          }}>
            <FiGitBranch size={24} strokeWidth={1.5} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
              <h3 style={{
                fontSize: 17,
                fontWeight: 600,
                color: '#111827',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                letterSpacing: '-0.02em',
                margin: 0,
                flex: 1
              }}>
                {u.name}
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span title={`Group: ${u.group || 'Default'}`} style={{ fontSize: 10, color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4 }}>
                <FiFolder size={10} /> {u.group || 'Default'}
              </span>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#D1D5DB' }} />
              <span style={{ fontSize: 10, color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4 }}>
                <FiTag size={10} /> {u.category || 'General'}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p style={{
          fontSize: 14,
          color: '#4B5563',
          lineHeight: 1.6,
          marginBottom: 16,
          minHeight: '2.8em',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          margin: 0
        }}>
          {u.description || 'No description provided.'}
        </p>

        {/* Rating, Status, and Approval Fields */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: '1px solid #F3F4F6', borderBottom: '1px solid #F3F4F6',
          padding: '12px 0', margin: '12px 0'
        }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Rating</span>
            <span style={{ fontSize: 13, color: '#4B5563', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: '#D97706' }}>★</span> {u.rating !== undefined && u.rating !== null ? u.rating.toFixed(1) : '0.0'}
            </span>
          </div>
          <div style={{ color: '#E5E7EB', fontWeight: 300 }}>|</div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Status</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                background: u.is_active ? '#10B981' : '#EF4444',
              }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#4B5563' }}>
                {u.is_active ? 'Active' : 'Paused'}
              </span>
            </div>
          </div>
          <div style={{ color: '#E5E7EB', fontWeight: 300 }}>|</div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Approval</span>
            {getStatusBadge(u.admin_status)}
          </div>
        </div>

        {/* Additional Metadata */}
        <div style={{ fontSize: 11, color: '#6B7280', display: 'flex', flexDirection: 'column', gap: 4, marginTop: 'auto' }}>
          <div><strong>Workflow ID:</strong> {u.id}</div>
          <div><strong>Version:</strong> v{u.version}</div>
        </div>
      </div>

      {/* Footer Actions */}
      <div style={{
        padding: '12px 16px',
        background: '#F9FAFB',
        borderTop: '1px solid #F3F4F6',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        position: 'relative'
      }} onClick={e => e.stopPropagation()}>
        {/* Play/Pause */}
        {u.is_active ? (
          <button
            onClick={() => handlePause(u.id)}
            title="Pause Workflow"
            disabled={actionInProgress === u.id}
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
            onClick={() => handleResume(u.id)}
            title="Resume Workflow"
            disabled={actionInProgress === u.id}
            style={{
              width: 36, height: 36, borderRadius: 8, border: '1px solid #A7F3D0',
              background: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#A7F3D0'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#ECFDF5'}
          >
            <FiPlay size={16} />
          </button>
        )}

        {/* Open Workflow */}
        <button
          onClick={() => handleOpenWorkflow(u.id)}
          title="Open in Editor"
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

        <div style={{ flex: 1 }} />

        {/* Approve Button */}
        {u.admin_status !== 'approved' && (
          <button
            onClick={() => handleUpdateStatus(u.id, 'approved')}
            disabled={actionInProgress === u.id}
            style={{
              padding: '8px 14px', borderRadius: 8, border: '1px solid #A7F3D0',
              background: '#ECFDF5', color: '#10B981', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#A7F3D0'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#ECFDF5'; }}
          >
            <FiCheck /> Approve
          </button>
        )}

        {/* Reject Button */}
        {u.admin_status !== 'rejected' && (
          <button
            onClick={() => setShowRemarksModal(u)}
            disabled={actionInProgress === u.id}
            style={{
              padding: '8px 14px', borderRadius: 8, border: '1px solid #FCA5A5',
              background: '#FEF2F2', color: '#EF4444', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#FCA5A5'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#FEF2F2'; }}
          >
            <FiX /> Reject
          </button>
        )}

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

export default function WorkflowPublishController() {
  const [activeTab, setActiveTab] = useState('pending'); // pending, approved, rejected, all
  const [viewMode, setViewMode] = useState('card'); // card, list
  const [usecases, setUsecases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('All');
  const [actionInProgress, setActionInProgress] = useState(null);

  // Remarks state for rejection
  const [remarksInput, setRemarksInput] = useState('');
  const [showRemarksModal, setShowRemarksModal] = useState(null); // holds usecase object
  const [showDetailsModal, setShowDetailsModal] = useState(null); // holds usecase object for details modal

  const handlePause = async (id) => {
    setActionInProgress(id);
    try {
      await dispatchScheduleAction(id, 'pause');
      loadUsecases();
    } catch (err) { 
      alert('Pause failed: ' + err.message); 
    } finally {
      setActionInProgress(null);
    }
  };

  const handleResume = async (id) => {
    setActionInProgress(id);
    try {
      await dispatchScheduleAction(id, 'resume');
      loadUsecases();
    } catch (err) { 
      alert('Resume failed: ' + err.message); 
    } finally {
      setActionInProgress(null);
    }
  };

  const handleOpenWorkflow = async (workflowId) => {
    try {
      const full = await getWorkflow(workflowId);
      if (full && full.config) {
        useWorkflowStore.getState().loadWorkflowIntoEditor(full.config);
        useUIStore.getState().setActivePage('canvas');
      } else {
        alert("Workflow details could not be loaded.");
      }
    } catch (err) {
      alert("Error opening workflow: " + err.message);
    }
  };

  const [filterOpen, setFilterOpen] = useState(false);
  const filterPanelRef = useRef(null);
  const searchInputRef = useRef(null);

  const [categories, setCategories] = useState(['All']);
  const [groups, setGroups] = useState(['All']);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalUsecases, setTotalUsecases] = useState(0);

  const totalPages = Math.ceil(totalUsecases / pageSize);

  const loadUsecases = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listMarketplaceUsecases({
        page: currentPage,
        limit: pageSize,
        group: selectedGroupFilter,
        category: selectedCategory,
        search: debouncedSearch,
        adminStatus: activeTab
      });
      if (res.status === 'success') {
        setUsecases(res.workflows || []);
        setTotalUsecases(res.total || 0);
        
        // Extract unique groups and categories if available from the dataset
        if (res.workflows) {
          const uniqueGroups = Array.from(new Set(res.workflows.map(w => w.group).filter(Boolean)));
          const uniqueCategories = Array.from(new Set(res.workflows.map(w => w.category).filter(Boolean)));
          setGroups(['All', ...uniqueGroups]);
          setCategories(['All', ...uniqueCategories]);
        }
      }
    } catch (e) {
      setError(e.message || 'Failed to load publish requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsecases();
  }, [currentPage, selectedCategory, selectedGroupFilter, debouncedSearch, activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedGroupFilter, debouncedSearch, activeTab]);

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

  const handleUpdateStatus = async (id, status, remarks = null) => {
    setActionInProgress(id);
    try {
      const res = await updateMarketplaceUsecaseStatus(id, status, remarks);
      if (res.status === 'success') {
        loadUsecases();
        setShowRemarksModal(null);
        setRemarksInput('');
      }
    } catch (e) {
      alert('Failed to update publish status: ' + e.message);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this publish request? This will remove it from the marketplace queue.")) return;
    setActionInProgress(id);
    try {
      const res = await deleteMarketplaceUsecase(id);
      if (res.status === 'success') {
        loadUsecases();
      }
    } catch (e) {
      alert('Failed to delete request: ' + e.message);
    } finally {
      setActionInProgress(null);
    }
  };

  const getStatusBadge = (status) => {
    let bg = '#FEF3C7', text = '#D97706', label = 'Pending';
    if (status === 'approved') {
      bg = '#ECFDF5'; text = '#10B981'; label = 'Approved';
    } else if (status === 'rejected') {
      bg = '#FEF2F2'; text = '#EF4444'; label = 'Rejected';
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
        <PageHeader 
          title="Publish Approval Queue" 
          description="Review, approve, or reject deployment requests for workflows submitted to the workspace." 
          letterSpacing="-0.5px"
        />
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
                  placeholder="Search requests..."
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
            onClick={loadUsecases}
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
              {(selectedCategory !== 'All' || selectedGroupFilter !== 'All') && (
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

          <div style={{ display: 'flex', gap: 2, background: 'var(--bg-canvas)', border: '1px solid var(--border)', borderRadius: 10, padding: '4px' }}>
            <button 
              onClick={() => setViewMode('card')}
              style={{
                background: viewMode === 'card' ? 'var(--theme-primary)' : 'transparent',
                color: viewMode === 'card' ? 'white' : '#6B7280',
                border: 'none', borderRadius: 6, padding: '6px 10px', display: 'flex', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s'
              }}
              title="Card View"
            >
              <FiGrid size={16} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              style={{
                background: viewMode === 'list' ? 'var(--theme-primary)' : 'transparent',
                color: viewMode === 'list' ? 'white' : '#6B7280',
                border: 'none', borderRadius: 6, padding: '6px 10px', display: 'flex', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s'
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
          { key: 'approved', label: 'Approved & Active' },
          { key: 'rejected', label: 'Rejected' },
          { key: 'All', label: 'All Requests' }
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

      {/* Grid Content */}
      <div style={{ flex: 1, padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 80, gap: 12, color: 'var(--text-muted)' }}>
            <div className="loading-spinner" /> <span style={{ fontSize: 14 }}>Loading requests…</span>
          </div>
        )}

        {!loading && error && (
          <div style={{ padding: '14px 20px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 12, color: '#DC2626', fontSize: 13, marginBottom: 24 }}>
            {error}
          </div>
        )}

        {!loading && !error && usecases.length === 0 ? (
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
            <FiGitBranch size={48} strokeWidth={1} />
            <div style={{ fontSize: 14, fontWeight: 500 }}>No requests found</div>
          </div>
        ) : (
          !loading && (
            viewMode === 'card' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24, marginBottom: 24 }}>
                {usecases.map((u, idx) => (
                  <PublishRequestCard
                    key={u.id}
                    u={u}
                    idx={idx}
                    handlePause={handlePause}
                    handleResume={handleResume}
                    handleOpenWorkflow={handleOpenWorkflow}
                    handleUpdateStatus={handleUpdateStatus}
                    setShowRemarksModal={setShowRemarksModal}
                    setShowDetailsModal={setShowDetailsModal}
                    handleDelete={handleDelete}
                    actionInProgress={actionInProgress}
                    getStatusBadge={getStatusBadge}
                  />
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {usecases.map((u, idx) => (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.02 }}
                    style={{
                      background: 'white', border: '1px solid #EAEAEA', borderRadius: 12, padding: '14px 20px',
                      display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#EAEAEA'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)'; }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--theme-primary-glow)', color: 'var(--theme-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FiGitBranch size={18} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>{u.name}</h3>
                        {getStatusBadge(u.admin_status)}
                        <span style={{ fontSize: 11, color: '#6B7280' }}>(v{u.version})</span>
                      </div>
                      <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.description || 'No description provided.'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', background: '#F1F5F9', padding: '4px 8px', borderRadius: 6 }}>
                        {u.category}
                      </span>
                      {u.remarks && (
                        <span style={{ fontSize: 11, color: '#DC2626', background: '#FEE2E2', padding: '4px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <FiMessageSquare size={12} /> Rejected reason
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                      {/* Play/Pause */}
                      {u.is_active ? (
                        <button
                          onClick={() => handlePause(u.id)}
                          title="Pause Workflow"
                          disabled={actionInProgress === u.id}
                          style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #E5E7EB', background: 'white', color: '#6B7280', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <FiPause size={12} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleResume(u.id)}
                          title="Resume Workflow"
                          disabled={actionInProgress === u.id}
                          style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #DCFCE7', background: '#F0FDF4', color: '#16A34A', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <FiPlay size={12} />
                        </button>
                      )}

                      {/* Open Workflow */}
                      <button
                        onClick={() => handleOpenWorkflow(u.id)}
                        title="Open in Editor"
                        style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #E5E7EB', background: 'white', color: '#111827', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <FiArrowRight size={12} />
                      </button>

                      {/* View details */}
                      <button
                        onClick={() => setShowDetailsModal(u)}
                        title="View Details"
                        style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #E5E7EB', background: 'white', color: '#6B7280', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <FiInfo size={12} />
                      </button>

                      {u.admin_status !== 'approved' && (
                        <button
                          onClick={() => handleUpdateStatus(u.id, 'approved')}
                          disabled={actionInProgress === u.id}
                          style={{ padding: '6px 10px', borderRadius: 6, background: '#D1FAE5', color: '#059669', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
                        >
                          Approve
                        </button>
                      )}
                      {u.admin_status !== 'rejected' && (
                        <button
                          onClick={() => setShowRemarksModal(u)}
                          disabled={actionInProgress === u.id}
                          style={{ padding: '6px 10px', borderRadius: 6, background: '#FEE2E2', color: '#DC2626', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
                        >
                          Reject
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(u.id)}
                        disabled={actionInProgress === u.id}
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
        {!loading && !error && usecases.length > 0 && (
          <div style={{ marginTop: 'auto' }}>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </div>
        )}
      </div>

      {/* Reject Remarks Modal */}
      <AnimatePresence>
        {showRemarksModal && (
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }} 
            onClick={() => setShowRemarksModal(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              style={{ width: '100%', maxWidth: 440, background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
              onClick={e => e.stopPropagation()}
            >
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1E1B4B', margin: '0 0 12px 0' }}>Provide Rejection Reason</h3>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                Please specify why this workflow publish request is being rejected. This feedback will be displayed to the submitter.
              </p>

              <textarea
                value={remarksInput}
                onChange={e => setRemarksInput(e.target.value)}
                placeholder="Enter rejection remarks..."
                style={{ width: '100%', height: 100, padding: 12, border: '1px solid #E2E8F0', borderRadius: 10, outline: 'none', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 20 }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  onClick={() => setShowRemarksModal(null)}
                  style={{ padding: '8px 14px', background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateStatus(showRemarksModal.id, 'rejected', remarksInput)}
                  disabled={actionInProgress === showRemarksModal.id || !remarksInput.trim()}
                  style={{ padding: '8px 14px', background: '#EF4444', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Confirm Reject
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Workflow Details Modal */}
      <AnimatePresence>
        {showDetailsModal && (
          <div 
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
              padding: 20
            }}
            onClick={() => setShowDetailsModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{
                width: '100%', maxWidth: 500, background: 'white', borderRadius: 20,
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden',
                fontFamily: "'Google Sans','Roboto',sans-serif"
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ padding: '24px 32px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>
                  Workflow Details
                </h3>
                <button onClick={() => setShowDetailsModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#9CA3AF' }}><FiX size={20} /></button>
              </div>

              <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{showDetailsModal.name}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</span>
                  <span style={{ fontSize: 14, color: '#4B5563', lineHeight: 1.6 }}>{showDetailsModal.description || 'No description provided.'}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Group</span>
                    <span style={{ fontSize: 14, color: '#4B5563' }}>{showDetailsModal.group || 'Default'}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</span>
                    <span style={{ fontSize: 14, color: '#4B5563' }}>{showDetailsModal.category || 'General'}</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rating</span>
                    <span style={{ fontSize: 14, color: '#D97706', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      ★ {showDetailsModal.rating !== undefined && showDetailsModal.rating !== null ? showDetailsModal.rating.toFixed(1) : '0.0'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
                        background: showDetailsModal.is_active ? '#34C759' : '#D4D4CC',
                        boxShadow: showDetailsModal.is_active ? '0 0 0 2px rgba(52,199,89,0.2)' : 'none',
                        flexShrink: 0,
                      }} />
                      <span style={{ fontSize: 13, color: '#4B5563' }}>{showDetailsModal.is_active ? 'Active' : 'Paused'}</span>
                    </div>
                  </div>
                </div>

                {showDetailsModal.remarks && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rejection Remarks</span>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, background: '#FEF2F2', padding: '10px 14px', borderRadius: 10, borderLeft: '3px solid #EF4444', color: '#EF4444', fontSize: 13, lineHeight: 1.5 }}>
                      <FiMessageSquare size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                      <span>{showDetailsModal.remarks}</span>
                    </div>
                  </div>
                )}

                {/* Internal ID */}
                <div style={{
                  marginTop: 12, padding: '16px', background: '#F8F9FA', borderRadius: 12, border: '1px solid #F1F1F1',
                  display: 'flex', flexDirection: 'column', gap: 8
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>Workflow ID</span>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#6B7280' }}>{showDetailsModal.id}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>Version</span>
                    <span style={{ fontSize: 12, color: '#4B5563' }}>v{showDetailsModal.version}</span>
                  </div>
                </div>
              </div>

              <div style={{ padding: '24px 32px', background: '#F9FAFB', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowDetailsModal(null)}
                  style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #E5E7EB', background: 'white', fontSize: 14, fontWeight: 600, color: '#4B5563', cursor: 'pointer' }}
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(null);
                    handleOpenWorkflow(showDetailsModal.id);
                  }}
                  style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'var(--theme-primary)', fontSize: 14, fontWeight: 600, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <FiArrowRight size={14} /> Open in Editor
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
