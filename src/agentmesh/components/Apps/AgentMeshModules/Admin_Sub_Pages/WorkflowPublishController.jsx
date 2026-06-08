import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiGitBranch, FiClock, FiCheckCircle, FiSearch, FiRefreshCw, FiTag, 
  FiFilter, FiX, FiCheck, FiTrash2, FiMessageSquare, FiGrid, FiList 
} from 'react-icons/fi';
import { 
  listMarketplaceUsecases, 
  updateMarketplaceUsecaseStatus, 
  deleteMarketplaceUsecase 
} from '../../../../api/agentmesh';
import Pagination from '../../../Common/Pagination';

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
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>Publish Approval Queue</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Review and authorize production deployment requests for workflows to the marketplace.</p>
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
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.04 }}
                    style={{
                      background: 'white', border: '1px solid #EAEAEA', borderRadius: 16,
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column',
                      padding: 20, gap: 14, transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.boxShadow = '0 12px 20px -3px rgba(0, 0, 0, 0.08)';
                      e.currentTarget.style.borderColor = '#CBD5E1';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.03)';
                      e.currentTarget.style.borderColor = '#EAEAEA';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FiTag size={10} /> {u.category}
                      </span>
                      {getStatusBadge(u.admin_status)}
                    </div>

                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>{u.name}</h3>
                      <p style={{ fontSize: 12, color: '#4B5563', lineHeight: 1.4, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {u.description || 'No description provided.'}
                      </p>
                    </div>

                    <div style={{ fontSize: 11, color: '#6B7280', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div><strong>Workflow ID:</strong> {u.id}</div>
                      <div><strong>Version:</strong> v{u.version}</div>
                      {u.remarks && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, background: '#F8FAFC', padding: '6px 10px', borderRadius: 8, borderLeft: '3px solid #64748B', marginTop: 4 }}>
                          <FiMessageSquare size={12} style={{ marginTop: 2, flexShrink: 0 }} />
                          <div><strong>Remarks:</strong> {u.remarks}</div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, borderTop: '1px solid #F3F4F6', paddingTop: 14, marginTop: 'auto' }}>
                      {u.admin_status !== 'approved' && (
                        <button
                          onClick={() => handleUpdateStatus(u.id, 'approved')}
                          disabled={actionInProgress === u.id}
                          style={{ padding: '6px 10px', borderRadius: 6, background: '#D1FAE5', color: '#059669', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700 }}
                        >
                          <FiCheck /> Approve
                        </button>
                      )}
                      {u.admin_status !== 'rejected' && (
                        <button
                          onClick={() => setShowRemarksModal(u)}
                          disabled={actionInProgress === u.id}
                          style={{ padding: '6px 10px', borderRadius: 6, background: '#FEE2E2', color: '#DC2626', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700 }}
                        >
                          <FiX /> Reject
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(u.id)}
                        disabled={actionInProgress === u.id}
                        style={{ padding: '6px 8px', borderRadius: 6, background: '#F1F5F9', color: '#64748B', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700 }}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </motion.div>
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

                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
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
    </div>
  );
}
