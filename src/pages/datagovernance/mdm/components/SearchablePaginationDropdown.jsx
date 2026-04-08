import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search } from 'lucide-react';

const SearchablePaginationDropdown = ({
    value,
    onChange,
    options = [],
    placeholder = 'Select',
    disabled = false,
    onLoadMore,
    hasMore = false,
    loadingMore = false,
    onSearch,
}) => {
    const [open, setOpen]             = useState(false);
    const [search, setSearch]         = useState('');
    const [panelStyle, setPanelStyle] = useState({});
    const triggerRef                  = useRef(null);
    const inputRef                    = useRef(null);
    const panelRef                    = useRef(null);

    const selected = options.find(o => o.value === value);

    const updatePosition = () => {
        if (!triggerRef.current) return;
        const rect        = triggerRef.current.getBoundingClientRect();
        const panelMaxH   = 280;
        const spaceBelow  = window.innerHeight - rect.bottom;
        const openUpward  = spaceBelow < panelMaxH && rect.top > spaceBelow;

        setPanelStyle({
            position : 'fixed',
            left     : rect.left,
            width    : rect.width,
            zIndex   : 99999,
            ...(openUpward
                ? { bottom: window.innerHeight - rect.top + 4 }
                : { top: rect.bottom + 4 }),
        });
    };

    /* ── Toggle ── */
    const handleToggle = () => {
        if (disabled) return;
        if (!open) updatePosition();
        setOpen(p => !p);
    };

    /* ── Close on outside click ── */
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (
                triggerRef.current && !triggerRef.current.contains(e.target) &&
                panelRef.current   && !panelRef.current.contains(e.target)
            ) {
                setOpen(false);
                setSearch('');
                onSearch?.('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open, onSearch]);

    useEffect(() => {
        if (!open) return;
        const reposition = () => updatePosition();
        window.addEventListener('scroll', reposition, true);
        window.addEventListener('resize', reposition);
        return () => {
            window.removeEventListener('scroll', reposition, true);
            window.removeEventListener('resize', reposition);
        };
    }, [open]);

    useEffect(() => {
        if (open && inputRef.current) inputRef.current.focus();
    }, [open]);

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearch(val);
        onSearch?.(val);
    };

    const displayOptions = onSearch
        ? options
        : options.filter(o =>
            o.label?.toLowerCase().includes(search.toLowerCase())
        );

    const handleSelect = (opt) => {
        onChange(opt.value);
        setOpen(false);
        setSearch('');
        onSearch?.('');
    };

    /* ── Portal panel ── */
    const panel = open ? createPortal(
        <div
            ref={panelRef}
            style={{
                ...panelStyle,
                backgroundColor : '#fff',
                border          : '1px solid #E5E7EB',
                borderRadius    : '10px',
                boxShadow       : '0 8px 24px rgba(0,0,0,0.12)',
                overflow        : 'hidden',
            }}
        >
            {/* Search box */}
            <div style={{ padding: '8px 10px', borderBottom: '1px solid #F3F4F6' }}>
                <div style={{ position: 'relative' }}>
                    <Search
                        size={13}
                        color="#9CA3AF"
                        style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                        ref={inputRef}
                        value={search}
                        onChange={handleSearchChange}
                        placeholder="Search..."
                        style={{
                            width       : '100%',
                            padding     : '6px 8px 6px 26px',
                            border      : '1px solid #E5E7EB',
                            borderRadius: '6px',
                            fontSize    : '13px',
                            outline     : 'none',
                            fontFamily  : 'Satoshi, sans-serif',
                            boxSizing   : 'border-box',
                        }}
                    />
                </div>
            </div>

            {/* Options list */}
            <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                {displayOptions.length === 0 && (
                    <div style={{
                        padding   : '12px 14px',
                        fontSize  : '13px',
                        color     : '#9CA3AF',
                        textAlign : 'center',
                        fontFamily: 'Satoshi, sans-serif',
                    }}>
                        No options found
                    </div>
                )}

                {displayOptions.map((opt) => (
                    <button
                        key={opt.value}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); handleSelect(opt); }}
                        style={{
                            width          : '100%',
                            textAlign      : 'left',
                            padding        : '9px 14px',
                            border         : 'none',
                            backgroundColor: opt.value === value ? '#FAF8FF' : '#fff',
                            color          : opt.value === value ? '#8E77BB'  : '#23252D',
                            fontSize       : '13px',
                            cursor         : 'pointer',
                            fontFamily     : 'Satoshi, sans-serif',
                            fontWeight     : opt.value === value ? 500 : 400,
                            display        : 'block',
                        }}
                        onMouseEnter={e => {
                            if (opt.value !== value) e.currentTarget.style.backgroundColor = '#F9FAFB';
                        }}
                        onMouseLeave={e => {
                            if (opt.value !== value) e.currentTarget.style.backgroundColor = '#fff';
                        }}
                    >
                        {opt.label}
                    </button>
                ))}

                {/* Load More row */}
                {(hasMore || loadingMore) && (
                    <button
                        type="button"
                        disabled={loadingMore}
                        onMouseDown={(e) => { e.preventDefault(); onLoadMore?.(); }}
                        style={{
                            width          : '100%',
                            padding        : '9px 14px',
                            border         : 'none',
                            borderTop      : '1px solid #F3F4F6',
                            backgroundColor: '#FAFAFA',
                            color          : '#8E77BB',
                            fontSize       : '13px',
                            cursor         : loadingMore ? 'not-allowed' : 'pointer',
                            fontFamily     : 'Satoshi, sans-serif',
                            fontWeight     : 500,
                            textAlign      : 'center',
                        }}
                    >
                        {loadingMore ? 'Loading…' : 'Load more'}
                    </button>
                )}
            </div>
        </div>,
        document.body
    ) : null;

    /* ── Trigger ── */
    return (
        <div style={{ position: 'relative', width: '100%' }}>
            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                onClick={handleToggle}
                style={{
                    width          : '100%',
                    display        : 'flex',
                    alignItems     : 'center',
                    justifyContent : 'space-between',
                    padding        : '9px 12px',
                    border         : open ? '1px solid #8E77BB' : '1px solid #CCCCCC',
                    borderRadius   : '8px',
                    backgroundColor: disabled ? '#F5F5F5' : '#fff',
                    cursor         : disabled ? 'not-allowed' : 'pointer',
                    fontSize       : '14px',
                    color          : selected ? '#282F49' : '#9CA3AF',
                    fontFamily     : 'Satoshi, sans-serif',
                    outline        : 'none',
                    transition     : 'border-color 0.15s',
                    minHeight      : '40px',
                    boxSizing      : 'border-box',
                }}
            >
                <span style={{
                    overflow     : 'hidden',
                    textOverflow : 'ellipsis',
                    whiteSpace   : 'nowrap',
                    flex         : 1,
                    textAlign    : 'left',
                }}>
                    {selected ? selected.label : placeholder}
                </span>
                <ChevronDown
                    size={16}
                    color="#9CA3AF"
                    style={{
                        flexShrink : 0,
                        marginLeft : 8,
                        transform  : open ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition : 'transform 0.15s',
                    }}
                />
            </button>

            {panel}
        </div>
    );
};

export default SearchablePaginationDropdown;