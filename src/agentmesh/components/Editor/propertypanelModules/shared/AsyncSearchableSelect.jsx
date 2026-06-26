import React, { useState, useEffect, useRef, memo } from 'react';
import { FiChevronDown, FiSearch } from 'react-icons/fi';
import { FONT } from './primitives';

export const AsyncSearchableSelect = memo(function AsyncSearchableSelect({
  value,
  onChange,
  loadOptions,
  loadSingleOption,
  placeholder = "Search...",
  disabled,
  showSearch = true,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch options when debouncedSearch or page changes
  useEffect(() => {
    let active = true;
    const fetchOptions = async () => {
      if (!isOpen) return;
      setLoading(true);
      if (page === 1) {
        setOptions([]);
      }
      try {
        const result = await loadOptions(debouncedSearch, page);
        if (active) {
          if (page === 1) {
            setOptions(result.options);
          } else {
            setOptions((prev) => [...prev, ...result.options]);
          }
          setHasMore(result.hasMore);
        }
      } catch (err) {
        console.error("Failed to load options:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchOptions();
    return () => {
      active = false;
    };
  }, [debouncedSearch, page, isOpen, loadOptions]);

  // Reset pagination when open state changes
  useEffect(() => {
    if (isOpen) {
      setPage(1);
      setOptions([]);
    } else {
      setSearch('');
      setDebouncedSearch('');
    }
  }, [isOpen]);

  // Fetch the selected option details when the value changes or on mount
  useEffect(() => {
    let active = true;
    const fetchSingle = async () => {
      if (!value) {
        setSelectedOption(null);
        return;
      }
      
      // First check if it is already in options
      const found = options.find((o) => o.value === value);
      if (found) {
        setSelectedOption(found);
        return;
      }

      if (loadSingleOption) {
        try {
          const single = await loadSingleOption(value);
          if (active && single) {
            setSelectedOption(single);
          }
        } catch (err) {
          console.error("Failed to load single option:", err);
        }
      }
    };

    fetchSingle();
    return () => {
      active = false;
    };
  }, [value, loadSingleOption, options]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 10 && hasMore && !loading) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border rounded-lg text-[13px] transition-colors duration-150 box-border flex items-center justify-between disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer ${disabled ? 'bg-[#F1F5F9]' : 'bg-white'} ${isOpen ? 'border-[var(--accent-btn)]' : 'border-[var(--border)]'}`}
        style={{ fontFamily: FONT, opacity: disabled ? 0.7 : 1 }}
      >
        <span className={`overflow-hidden text-ellipsis whitespace-nowrap ${selectedOption ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <FiChevronDown size={14} className="text-[var(--text-muted)] transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }} />
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-[var(--border)] rounded-xl shadow-2xl z-[1000] overflow-hidden">
          {showSearch && (
            <div className="p-2 border-b border-[var(--border-light)] bg-[var(--bg-card-neutral,#F8FAFC)]">
              <div className="relative">
                <FiSearch size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  ref={inputRef}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Type to search..."
                  className="w-full pl-8 pr-2.5 py-1.5 rounded-md border border-[var(--border)] text-xs outline-none bg-white"
                />
              </div>
            </div>
          )}
          <div
            className="max-h-[220px] overflow-y-auto p-1"
            onScroll={handleScroll}
          >
            {options.length === 0 && !loading ? (
              <div className="p-3 text-xs text-[var(--text-muted)] text-center">No results found</div>
            ) : (
              <>
                {options.map((o) => (
                  <div
                    key={o.value}
                    onClick={() => {
                      onChange(o.value);
                      setIsOpen(false);
                    }}
                    className={`p-2 rounded-md cursor-pointer text-xs transition-colors duration-150 flex items-center justify-between ${value === o.value ? 'bg-[#F0F4FF] text-[var(--accent-btn)] font-semibold' : 'text-[var(--text-primary)] hover:bg-[#F0F4FF] hover:text-[var(--accent-btn)]'}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="whitespace-nowrap overflow-hidden text-ellipsis">{o.label}</div>
                      {o.sublabel && <div className="text-[10px] opacity-60 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{o.sublabel}</div>}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="p-2 text-center text-xs text-[var(--text-muted)]">
                    Loading...
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
