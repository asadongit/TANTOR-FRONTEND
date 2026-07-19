import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiSearch, FiFilter, FiGrid, FiList } from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';
import PageHeader from './PageHeader';

export default function LibraryHeader({
  title,
  description,
  search,
  onSearchChange,
  groups = ['All'],
  categories = ['All'],
  selectedGroup = 'All',
  onGroupChange,
  selectedCategory = 'All',
  onCategoryChange,
  nodeTypes = [],
  selectedNodeType = 'All',
  onNodeTypeChange,
  tags = [],
  selectedTag = 'All',
  onTagChange,
  tagLabel = 'Tag',
  viewMode = 'cards',
  onViewModeChange,
  placeholder = 'Search templates...',
  actions = null,
  showFilters = true,
  showViewToggle = true,
  showSearch = true,
}) {
  const [searchOpen, setSearchOpen] = useState(!!search);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterPanelRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close filter popover on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterPanelRef.current && !filterPanelRef.current.contains(event.target)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 50);
    }
  }, [searchOpen]);

  // Keydown listener for 's' keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
         activeEl.tagName === 'TEXTAREA' ||
         activeEl.isContentEditable)
      ) {
        return;
      }
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        }, 50);
      }
    };
    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, []);

  const hasActiveFilters = selectedGroup !== 'All' || selectedCategory !== 'All' || selectedNodeType !== 'All' || selectedTag !== 'All';

  const handleReset = () => {
    if (onGroupChange) onGroupChange('All');
    if (onCategoryChange) onCategoryChange('All');
    if (onNodeTypeChange) onNodeTypeChange('All');
    if (onTagChange) onTagChange('All');
    setFilterOpen(false);
  };

  return (
    <div style={{ padding: '16px 32px', borderBottom: '1px solid var(--border-light)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <PageHeader title={title} description={description} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Collapsible Search Bar */}
        {showSearch && (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', transition: 'width 0.2s', width: (searchOpen || search) ? 320 : 36 }}>
            {(!searchOpen && !search) ? (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                title={placeholder}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8
                }}
              >
                <FiSearch size={18} color="#6B7280" />
              </button>
            ) : (
              <div style={{ position: 'relative', width: '100%' }}>
                <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} size={16} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={placeholder}
                  value={search}
                  onChange={e => onSearchChange(e.target.value)}
                  onBlur={() => { if (!search) setSearchOpen(false); }}
                  style={{
                    width: '100%', padding: '8px 12px 8px 36px', border: '1px solid #E5E7EB', borderRadius: 10,
                    fontSize: 14, outline: 'none', background: 'white', color: '#111827'
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Filters Popover */}
        {showFilters && (
          <div style={{ position: 'relative' }} ref={filterPanelRef}>
            <button
              type="button"
              onClick={() => setFilterOpen(!filterOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
                background: filterOpen ? '#111827' : 'white',
                color: filterOpen ? 'white' : '#111827',
                border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <FiFilter size={16} /> Filters
              {hasActiveFilters && (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444' }} />
              )}
            </button>

            <AnimatePresence>
              {filterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 260,
                    background: 'white', border: '1px solid #E5E7EB', borderRadius: 12,
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', zIndex: 100, padding: 16,
                    maxHeight: '260px', overflowY: 'auto'
                  }}
                >
                  {nodeTypes && nodeTypes.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 8 }}>By Node Type</div>
                      <select
                        value={selectedNodeType}
                        onChange={e => { if (onNodeTypeChange) onNodeTypeChange(e.target.value); }}
                        style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: 8, outline: 'none', fontSize: 13 }}
                      >
                        {nodeTypes.map(nt => <option key={nt.value} value={nt.value}>{nt.label}</option>)}
                      </select>
                    </div>
                  )}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 8 }}>By Group</div>
                    <select
                      value={selectedGroup}
                      onChange={e => { if (onGroupChange) onGroupChange(e.target.value); }}
                      style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: 8, outline: 'none', fontSize: 13 }}
                    >
                      {groups.map(g => <option key={g} value={g}>{g === 'All' ? 'All Groups' : g}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 8 }}>By Category</div>
                    <select
                      value={selectedCategory}
                      onChange={e => { if (onCategoryChange) onCategoryChange(e.target.value); }}
                      style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: 8, outline: 'none', fontSize: 13 }}
                    >
                      {categories.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
                    </select>
                  </div>
                  {tags && tags.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>By {tagLabel}</div>
                      <select
                        value={selectedTag}
                        onChange={e => { if (onTagChange) onTagChange(e.target.value); }}
                        style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: 8, outline: 'none', fontSize: 13 }}
                      >
                        {tags.map(t => <option key={t} value={t}>{t === 'All' ? `All ${tagLabel}s` : t}</option>)}
                      </select>
                    </div>
                  )}
                  <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={handleReset}
                      style={{ padding: '6px 10px', fontSize: 12, color: '#6B7280', border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      Reset
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Custom Actions (like Add Skill button) */}
        {actions}

        {/* Grid/List View Toggles */}
        {showViewToggle && onViewModeChange && (
          <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 10, padding: 2 }}>
            <button
              type="button"
              onClick={() => onViewModeChange('cards')}
              style={{
                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: viewMode === 'cards' ? 'white' : 'transparent',
                border: 'none', borderRadius: 8, cursor: 'pointer',
                color: viewMode === 'cards' ? '#111827' : '#9CA3AF',
                boxShadow: viewMode === 'cards' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <FiGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              style={{
                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: viewMode === 'list' ? 'white' : 'transparent',
                border: 'none', borderRadius: 8, cursor: 'pointer',
                color: viewMode === 'list' ? '#111827' : '#9CA3AF',
                boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <FiList size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

LibraryHeader.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  search: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  groups: PropTypes.arrayOf(PropTypes.string),
  categories: PropTypes.arrayOf(PropTypes.string),
  selectedGroup: PropTypes.string,
  onGroupChange: PropTypes.func,
  selectedCategory: PropTypes.string,
  onCategoryChange: PropTypes.func,
  nodeTypes: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired
  })),
  selectedNodeType: PropTypes.string,
  onNodeTypeChange: PropTypes.func,
  tags: PropTypes.arrayOf(PropTypes.string),
  selectedTag: PropTypes.string,
  onTagChange: PropTypes.func,
  tagLabel: PropTypes.string,
  viewMode: PropTypes.oneOf(['cards', 'list']),
  onViewModeChange: PropTypes.func,
  placeholder: PropTypes.string,
  actions: PropTypes.node,
  showFilters: PropTypes.bool,
  showViewToggle: PropTypes.bool,
  showSearch: PropTypes.bool
};
