import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiGitBranch, FiRefreshCw, FiTag, 
  FiX, FiCheck, FiTrash2, FiMessageSquare,
  FiPlay, FiPause, FiArrowRight, FiInfo, FiMoreHorizontal, FiFolder, FiLoader
} from 'react-icons/fi';
import { 
  listMarketplaceUsecases, 
  updateMarketplaceUsecaseStatus, 
  deleteMarketplaceUsecase,
  getWorkflow,
  dispatchScheduleAction
} from '../../../../api/agentmesh';
import { useWorkflowStore, useUIStore, useRunStore } from '../../../../store';
import Pagination from '../../../Common/Pagination';
import LibraryHeader from '../../../Common/LibraryHeader';

function ActionDropdown({ actions, isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-[140px] p-1.5"
    >
      {actions.map((a, i) => (
        <button
          key={i}
          onClick={(e) => { e.stopPropagation(); a.onClick(); onClose(); }}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg border-none bg-transparent text-xs font-medium cursor-pointer transition-all duration-150 ${
            a.variant === 'danger' ? 'text-red-500 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {a.icon} {a.label}
        </button>
      ))}
    </motion.div>
  );
}

const PublishRequestCard = React.memo(function PublishRequestCard({ 
  u, idx, handlePause, handleResume, handleOpenWorkflow, handleUpdateStatus, 
  setShowRemarksModal, setShowDetailsModal, handleDelete, actionInProgress, 
  getStatusBadge, handleLaunch, isLaunching 
}) {
  const [showMore, setShowMore] = useState(false);
  const navigate = useNavigate();

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
      className="bg-white border border-[#F0F0EE] rounded-3xl shadow-sm flex flex-col relative overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-md hover:border-gray-300"
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
            className="w-9 h-9 rounded-lg border border-gray-200 bg-white text-gray-500 flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-gray-100"
          >
            <FiPause size={16} />
          </button>
        ) : (
          <button
            onClick={() => handleResume(u.id)}
            title="Resume Workflow"
            disabled={actionInProgress === u.id}
            className="w-9 h-9 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-emerald-200"
          >
            <FiPlay size={16} />
          </button>
        )}

        {/* Open Workflow */}
        <button
          onClick={() => handleOpenWorkflow(u.id)}
          title="Open in Editor"
          className="w-9 h-9 rounded-lg border border-gray-200 bg-white text-gray-900 flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-gray-100"
        >
          <FiArrowRight size={18} />
        </button>

        {/* Launch button */}
        <button
          onClick={(e) => handleLaunch(u, e)}
          disabled={isLaunching || actionInProgress === u.id}
          title="Launch / Preview Usecase"
          className="px-3 h-9 rounded-lg border-none flex items-center justify-center gap-1.5 text-[11px] font-extrabold cursor-pointer transition-all duration-200 bg-[var(--theme-primary-glow)] text-[var(--theme-primary)] hover:bg-[var(--theme-primary)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          {isLaunching ? <FiLoader className="animate-spin" size={12} /> : <FiPlay size={12} />} 
          {isLaunching ? 'Launching...' : 'Launch'}
        </button>

        <div style={{ flex: 1 }} />

        {/* Reject Button */}
        {u.admin_status !== 'rejected' && (
          <button
            onClick={() => setShowRemarksModal(u)}
            disabled={actionInProgress === u.id}
            className="px-3.5 py-2 rounded-lg border border-red-300 bg-red-50 text-red-700 cursor-pointer flex items-center gap-1.5 text-xs font-bold transition-all duration-200 hover:bg-red-200"
          >
            <FiX /> Reject
          </button>
        )}

        {/* Approve Button */}
        {u.admin_status !== 'approved' && (
          <button
            onClick={() => handleUpdateStatus(u.id, 'approved')}
            disabled={actionInProgress === u.id}
            className="px-3.5 py-2 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 cursor-pointer flex items-center gap-1.5 text-xs font-bold transition-all duration-200 hover:bg-emerald-200"
          >
            <FiCheck /> Approve
          </button>
        )}

        {/* More Options */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setShowMore(!showMore); }}
            title="More Options"
            className="w-9 h-9 rounded-lg border border-gray-200 bg-white text-gray-500 flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-gray-100"
          >
            <FiMoreHorizontal size={18} />
          </button>
          <ActionDropdown actions={moreActions} isOpen={showMore} onClose={() => setShowMore(false)} />
        </div>
      </div>
    </motion.div>
  );
});

const getStatusBadge = (status) => {
  let bgClass = 'bg-[#FEF3C7] text-[#D97706]', label = 'Pending';
  if (status === 'approved') {
    bgClass = 'bg-[#ECFDF5] text-[#10B981]'; label = 'Approved';
  } else if (status === 'rejected') {
    bgClass = 'bg-[#FEF2F2] text-[#EF4444]'; label = 'Rejected';
  }
  return (
    <span className={`px-2 py-0.5 rounded-xl text-[10px] font-bold uppercase tracking-wider ${bgClass}`}>
      {label}
    </span>
  );
};

export default function WorkflowPublishController() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending'); // pending, approved, rejected, all
  const [viewMode, setViewMode] = useState('card'); // card, list
  const [usecases, setUsecases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  // const [searchOpen, setSearchOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('All');
  const [actionInProgress, setActionInProgress] = useState(null);
  const [launchingId, setLaunchingId] = useState(null);

  // Remarks state for rejection
  const [remarksInput, setRemarksInput] = useState('');
  const [showRemarksModal, setShowRemarksModal] = useState(null); // holds usecase object
  const [showDetailsModal, setShowDetailsModal] = useState(null); // holds usecase object for details modal

  // const [filterOpen, setFilterOpen] = useState(false);
  // const filterPanelRef = useRef(null);
  // const searchInputRef = useRef(null);

  const [categories, setCategories] = useState(['All']);
  const [groups, setGroups] = useState(['All']);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalUsecases, setTotalUsecases] = useState(0);

  const totalPages = Math.ceil(totalUsecases / pageSize);
  const lastFetchedRef = useRef({ page: null, category: null, group: null, search: null, tab: null });

  const loadUsecases = useCallback(async (pageToLoad = currentPage, signal = null) => {
    setLoading(true);
    setError(null);
    try {
      const res = await listMarketplaceUsecases({
        page: pageToLoad,
        limit: pageSize,
        group: selectedGroupFilter,
        category: selectedCategory,
        search: debouncedSearch,
        adminStatus: activeTab
      }, { signal });
      if (res.status === 'success') {
        setUsecases(res.workflows || []);
        setTotalUsecases(res.total || 0);
      }
    } catch (e) {
      if (e.name === 'AbortError') return;
      setError(e.message || 'Failed to load publish requests.');
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [currentPage, pageSize, selectedGroupFilter, selectedCategory, debouncedSearch, activeTab]);

  // Load all unique groups/categories once initially so the filters don't shrink or change dynamically
  const loadFilters = useCallback(async () => {
    try {
      const res = await listMarketplaceUsecases({ page: 1, limit: 1000 });
      if (res.status === 'success' && res.workflows) {
        const uniqueGroups = Array.from(new Set(res.workflows.map(w => w.group).filter(Boolean)));
        const uniqueCategories = Array.from(new Set(res.workflows.map(w => w.category).filter(Boolean)));
        setGroups(['All', ...uniqueGroups]);
        setCategories(['All', ...uniqueCategories]);
      }
    } catch (e) {
      console.error('Failed to load filters:', e);
    }
  }, []);

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  const handlePause = useCallback(async (id) => {
    setActionInProgress(id);
    try {
      await dispatchScheduleAction(id, 'pause');
      await loadUsecases();
    } catch (err) { 
      alert('Pause failed: ' + err.message); 
    } finally {
      setActionInProgress(null);
    }
  }, [loadUsecases]);

  const handleResume = useCallback(async (id) => {
    setActionInProgress(id);
    try {
      await dispatchScheduleAction(id, 'resume');
      await loadUsecases();
    } catch (err) { 
      alert('Resume failed: ' + err.message); 
    } finally {
      setActionInProgress(null);
    }
  }, [loadUsecases]);

  const handleLaunch = useCallback(async (u, e) => {
    if (e) e.stopPropagation();
    if (u.launch_mode === 'navigation' && u.navigation_path) {
      navigate(u.navigation_path, { state: { fromMarketplace: true, usecaseName: u.name } });
    } else if (u.launch_url) {
      globalThis.open(u.launch_url, '_blank', 'noopener,noreferrer');
    } else {
      setLaunchingId(u.id);
      try {
        const full = await getWorkflow(u.id);
        if (full) {
          const currentWfId = useWorkflowStore.getState().workflowId;
          if (currentWfId !== u.id) {
            useRunStore.getState().reset();
          }
          await useWorkflowStore.getState().loadWorkflowIntoEditor(full.config || full);
          useUIStore.getState().setRunOpen(true);
        } else {
          alert("Workflow details could not be loaded.");
        }
      } catch (err) {
        alert("Error launching workflow: " + err.message);
      } finally {
        setLaunchingId(null);
      }
    }
  }, [navigate]);

  const handleOpenWorkflow = useCallback(async (workflowId) => {
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
  }, []);

  const handleUpdateStatus = useCallback(async (id, status, remarks = null) => {
    setActionInProgress(id);
    try {
      const res = await updateMarketplaceUsecaseStatus(id, status, remarks);
      if (res.status === 'success') {
        await loadUsecases();
        setShowRemarksModal(null);
        setRemarksInput('');
      }
    } catch (e) {
      alert('Failed to update publish status: ' + e.message);
    } finally {
      setActionInProgress(null);
    }
  }, [loadUsecases]);

  const handleDelete = useCallback(async (id) => {
    if (!globalThis.confirm("Are you sure you want to delete this publish request? This will remove it from the marketplace queue.")) return;
    setActionInProgress(id);
    try {
      const res = await deleteMarketplaceUsecase(id);
      if (res.status === 'success') {
        await loadUsecases();
      }
    } catch (e) {
      alert('Failed to delete request: ' + e.message);
    } finally {
      setActionInProgress(null);
    }
  }, [loadUsecases]);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const prev = lastFetchedRef.current;
    const filtersChanged =
      selectedCategory !== prev.category ||
      selectedGroupFilter !== prev.group ||
      debouncedSearch !== prev.search ||
      activeTab !== prev.tab;

    let targetPage = currentPage;
    if (filtersChanged) {
      targetPage = 1;
      setCurrentPage(1);
    }

    if (
      prev.page === targetPage &&
      prev.category === selectedCategory &&
      prev.group === selectedGroupFilter &&
      prev.search === debouncedSearch &&
      prev.tab === activeTab
    ) {
      return;
    }

    lastFetchedRef.current = {
      page: targetPage,
      category: selectedCategory,
      group: selectedGroupFilter,
      search: debouncedSearch,
      tab: activeTab
    };

    loadUsecases(targetPage, signal);

    return () => {
      controller.abort();
    };
  }, [currentPage, selectedCategory, selectedGroupFilter, debouncedSearch, activeTab, loadUsecases]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Cleaned up old filter/search handlers (now managed inside LibraryHeader)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F8FAFC', height: '100%', overflow: 'hidden', fontFamily: "'Google Sans','Roboto',sans-serif" }}>
      <LibraryHeader
        title="Publish Approval Queue"
        description="Review, approve, or reject deployment requests for workflows submitted to the workspace."
        search={search}
        onSearchChange={setSearch}
        placeholder="Search requests..."
        groups={groups}
        selectedGroup={selectedGroupFilter}
        onGroupChange={setSelectedGroupFilter}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        viewMode={viewMode === 'card' ? 'cards' : 'list'}
        onViewModeChange={(mode) => setViewMode(mode === 'cards' ? 'card' : 'list')}
        actions={
          <button
            onClick={loadUsecases}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--theme-primary-glow)', color: 'var(--theme-primary)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            <FiRefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        }
      />

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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 24, marginBottom: 24 }}>
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
                    handleLaunch={handleLaunch}
                    isLaunching={launchingId === u.id}
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
                    className="bg-white border border-[#EAEAEA] rounded-xl py-3.5 px-5 flex items-center gap-4 transition-all duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-slate-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)]"
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
                          className="px-2 py-1.5 rounded-md border border-gray-200 bg-white text-gray-500 cursor-pointer flex items-center transition-all duration-200 hover:bg-gray-100"
                        >
                          <FiPause size={12} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleResume(u.id)}
                          title="Resume Workflow"
                          disabled={actionInProgress === u.id}
                          className="px-2 py-1.5 rounded-md border border-emerald-100 bg-[#F0FDF4] text-emerald-700 cursor-pointer flex items-center transition-all duration-200 hover:bg-emerald-100"
                        >
                          <FiPlay size={12} />
                        </button>
                      )}

                      {/* Open Workflow */}
                      <button
                        onClick={() => handleOpenWorkflow(u.id)}
                        title="Open in Editor"
                        className="px-2 py-1.5 rounded-md border border-gray-200 bg-white text-gray-900 cursor-pointer flex items-center transition-all duration-200 hover:bg-gray-100"
                      >
                        <FiArrowRight size={12} />
                      </button>

                      {/* Launch Usecase */}
                      <button
                        onClick={(e) => handleLaunch(u, e)}
                        disabled={launchingId === u.id || actionInProgress === u.id}
                        title="Launch Usecase"
                        className="px-2.5 py-1.5 rounded-md border-none cursor-pointer text-[11px] font-bold bg-[var(--theme-primary-glow)] text-[var(--theme-primary)] hover:bg-[var(--theme-primary)] hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        {launchingId === u.id && <FiLoader className="animate-spin" size={10} />}
                        {launchingId === u.id ? 'Launching...' : 'Launch'}
                      </button>

                      {/* View details */}
                      <button
                        onClick={() => setShowDetailsModal(u)}
                        title="View Details"
                        className="px-2 py-1.5 rounded-md border border-gray-200 bg-white text-gray-500 cursor-pointer flex items-center transition-all duration-200 hover:bg-gray-100"
                      >
                        <FiInfo size={12} />
                      </button>

                      {u.admin_status !== 'rejected' && (
                        <button
                          onClick={() => setShowRemarksModal(u)}
                          disabled={actionInProgress === u.id}
                          className="px-2.5 py-1.5 rounded-md bg-red-50 text-red-700 border border-red-200 cursor-pointer text-[11px] font-bold hover:bg-red-100 transition-all duration-200"
                        >
                          Reject
                        </button>
                      )}
                      {u.admin_status !== 'approved' && (
                        <button
                          onClick={() => handleUpdateStatus(u.id, 'approved')}
                          disabled={actionInProgress === u.id}
                          className="px-2.5 py-1.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-pointer text-[11px] font-bold hover:bg-emerald-100 transition-all duration-200"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(u.id)}
                        disabled={actionInProgress === u.id}
                        className="px-2 py-1.5 rounded-md bg-slate-50 text-slate-500 border border-slate-200 cursor-pointer hover:bg-slate-100 hover:text-slate-700 transition-all duration-200"
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
