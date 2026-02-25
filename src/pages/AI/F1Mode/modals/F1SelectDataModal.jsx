import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { ChevronDown, X } from "lucide-react";
import { useAIPlayground } from "../../../../context/AIPlaygroundContext";

function F1SelectDataModal({ isOpen, onClose, onSuccess }) {
    const hostnameAI = window._env_?.VITE_AI_API;
    const { token, decodedToken } = useAuth();
    const [selectedTable, setSelectedTable] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [availableTables, setAvailableTables] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isIngesting, setIsIngesting] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const { setF1Mode } = useAIPlayground();

    const [dropdownRect, setDropdownRect] = useState(null);

    const dropdownTriggerRef = useRef(null);
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);

    useEffect(() => {
        if (isOpen) fetchTables();
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            const trigger = dropdownTriggerRef.current;
            const menu = dropdownRef.current;
            if (
                trigger && !trigger.contains(e.target) &&
                menu && !menu.contains(e.target)
            ) {
                setIsDropdownOpen(false);
                setSearchQuery('');
            }
        };
        if (isDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isDropdownOpen]);

    useEffect(() => {
        if (isDropdownOpen && searchInputRef.current) {
            setTimeout(() => searchInputRef.current?.focus(), 50);
        }
    }, [isDropdownOpen]);

    useEffect(() => {
        if (!isDropdownOpen) return;
        const updateRect = () => {
            if (dropdownTriggerRef.current) {
                setDropdownRect(dropdownTriggerRef.current.getBoundingClientRect());
            }
        };
        updateRect();
        window.addEventListener('scroll', updateRect, true);
        window.addEventListener('resize', updateRect);
        return () => {
            window.removeEventListener('scroll', updateRect, true);
            window.removeEventListener('resize', updateRect);
        };
    }, [isDropdownOpen]);

    const handleToggleDropdown = () => {
        if (dropdownTriggerRef.current) {
            setDropdownRect(dropdownTriggerRef.current.getBoundingClientRect());
        }
        setIsDropdownOpen((prev) => !prev);
    };

    const fetchTables = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const sqRes = await fetch(`${window._env_?.VITE_FAST_API}/secure-query`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_query: '' }),
            });
            if (!sqRes.ok) throw new Error('Failed to fetch policy IDs');
            const sqData = await sqRes.json();

            const res = await fetch(`${hostnameAI}/schemas/source-schema/tables`, {
                method: 'POST',
                headers: { accept: 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ policy_id: sqData.matched_policy_ids }),
            });
            if (!res.ok) throw new Error('Failed to fetch tables');
            const data = await res.json();
            setAvailableTables(data.tables.map((t) => ({ value: t, label: t })));
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProceed = async () => {
        if (!selectedTable) return;
        setIsIngesting(true);
        setError(null);

        try {
            const sqRes = await fetch(`${window._env_?.VITE_FAST_API}/secure-query`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_query: '' }),
            });
            if (!sqRes.ok) throw new Error('Failed to fetch policy IDs');
            const sqData = await sqRes.json();

            const res = await fetch(`${hostnameAI}/data/f1/ingestion`, {
                method: 'POST',
                headers: { accept: 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    table_name: selectedTable,
                    user_name: decodedToken?.preferred_username,
                    policy_id: sqData.matched_policy_ids,
                }),
            });

            if (!res.ok) throw new Error(`Ingestion failed: ${res.status}`);

            const ingestionData = await res.json();

            if (ingestionData?.session_id && Array.isArray(ingestionData?.column_names)) {
                setF1Mode((prev) => ({
                    ...prev,
                    session_id: ingestionData.session_id,
                    column_names: ingestionData.column_names,
                }));
            }

            onSuccess(selectedTable);
            handleClose();
        } catch (err) {
            setError(err.message || 'Something went wrong during ingestion');
        } finally {
            setIsIngesting(false);
        }
    };

    const handleClose = () => {
        setSelectedTable('');
        setIsDropdownOpen(false);
        setSearchQuery('');
        setError(null);
        onClose();
    };

    const handleSelectTable = (value) => {
        setSelectedTable(value);
        setIsDropdownOpen(false);
        setSearchQuery('');
    };

    const filteredTables = availableTables.filter((t) =>
        t.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 flex items-center justify-center z-50"
                style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
            >
                <div
                    className="relative w-full rounded-2xl"
                    style={{
                        maxWidth: 420,
                        background: 'linear-gradient(145deg, #1a0000 0%, #2d0505 60%, #4a0a0a 100%)',
                        border: '1px solid rgba(160,30,30,0.45)',
                        boxShadow: '0 0 60px rgba(141,23,24,0.35), 0 20px 60px rgba(0,0,0,0.7)',
                    }}
                >
                    <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 200, height: 120, borderRadius: '50%', background: 'rgba(141,23,24,0.18)', filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0 }} />

                    {/* Header */}
                    <div
                        className="relative flex items-center justify-between px-6 pt-6 pb-4"
                        style={{ borderBottom: '1px solid rgba(160,30,30,0.25)', zIndex: 1 }}
                    >
                        <div className="flex items-center gap-2.5">
                            <h2 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, letterSpacing: '0.02em' }}>Select Data Table</h2>
                        </div>
                        <button
                            onClick={handleClose}
                            disabled={isIngesting}
                            style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.4rem', padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="relative px-6 pt-5 pb-5" style={{ zIndex: 1 }}>
                        <p style={{ color: '#fff', fontSize: '0.8rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                            Choose a pre-configured database table to fetch data and start the race.
                        </p>

                        {error && (
                            <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.35)' }}>
                                <p style={{ color: '#ff8080', fontSize: '0.78rem' }}>⚠ {error}</p>
                            </div>
                        )}

                        <label style={{ color: '#fff', fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Available Tables
                        </label>

                        {/* Dropdown trigger */}
                        <button
                            ref={dropdownTriggerRef}
                            onClick={handleToggleDropdown}
                            disabled={isLoading || availableTables.length === 0 || isIngesting}
                            className="w-full flex items-center justify-between focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            style={{
                                padding: '0.6rem 0.85rem',
                                borderRadius: '0.65rem',
                                background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.2) 104.43%)',
                                backdropFilter: 'blur(4px)',
                                border: isDropdownOpen || selectedTable ? '1.5px solid rgba(200,50,50,0.6)' : '1.5px solid rgba(120,20,20,0.4)',
                                color: '#fff',
                                fontSize: '0.875rem',
                            }}
                        >
                            <span>
                                {isLoading
                                    ? 'Loading tables...'
                                    : selectedTable
                                        ? availableTables.find((v) => v.value === selectedTable)?.label
                                        : availableTables.length === 0
                                            ? 'No tables available'
                                            : 'Select a table'}
                            </span>
                            <ChevronDown
                                className="w-4 h-4 transition-transform flex-shrink-0"
                                style={{
                                    color: 'rgba(255,255,255,0.4)',
                                    transform: isDropdownOpen ? 'rotate(180deg)' : 'none',
                                }}
                            />
                        </button>
                    </div>

                    {/* Footer */}
                    <div
                        className="relative flex items-center justify-end gap-3 px-6 py-4"
                        style={{ borderTop: '1px solid rgba(160,30,30,0.25)', zIndex: 1 }}
                    >
                        <button
                            onClick={handleClose}
                            disabled={isIngesting}
                            className="transition-all disabled:opacity-50"
                            style={{
                                padding: '0.5rem 1.1rem',
                                borderRadius: '0.6rem',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                color: 'rgba(255,255,255,0.6)',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleProceed}
                            disabled={!selectedTable || isIngesting}
                            className="transition-all disabled:opacity-40"
                            style={{
                                padding: '0.5rem 1.25rem',
                                borderRadius: '0.6rem',
                                background: isIngesting
                                    ? 'rgba(141,23,24,0.6)'
                                    : 'linear-gradient(270deg, #D30101 0%, #6D0101 117.78%)',
                                border: 'none',
                                color: '#fff',
                                fontSize: '0.875rem',
                                fontWeight: 700,
                                letterSpacing: '0.04em',
                                boxShadow: '0 0 20px rgba(220,38,38,0.35)',
                            }}
                        >
                            {isIngesting ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                    </svg>
                                    Processing...
                                </span>
                            ) : 'Proceed'}
                        </button>
                    </div>
                </div>
            </div>

            {isDropdownOpen && !isLoading && availableTables.length > 0 && dropdownRect && (
                <div
                    ref={dropdownRef}
                    style={{
                        position: 'fixed',
                        top: dropdownRect.bottom + 6,
                        left: dropdownRect.left,
                        width: dropdownRect.width,
                        zIndex: 9999,
                        background: 'linear-gradient(145deg, #1e0303, #2d0808)',
                        border: '1px solid rgba(160,30,30,0.5)',
                        borderRadius: '0.65rem',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.8), 0 0 20px rgba(141,23,24,0.2)',
                        overflow: 'hidden',
                    }}
                >
                    {/* Search */}
                    <div className="p-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="relative">
                            <svg
                                viewBox="0 0 24 24" width="14" height="14" fill="none"
                                stroke="rgba(255,255,255,0.3)" strokeWidth="2"
                                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                            >
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search tables..."
                                className="w-full focus:outline-none"
                                style={{
                                    paddingLeft: 32, paddingRight: 10, paddingTop: 8, paddingBottom: 8,
                                    borderRadius: '0.45rem',
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#fff',
                                    fontSize: '0.825rem',
                                }}
                            />
                        </div>
                    </div>

                    {/* Table list */}
                    <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                        {filteredTables.length > 0 ? (
                            filteredTables.map((t) => (
                                <button
                                    key={t.value}
                                    onClick={() => handleSelectTable(t.value)}
                                    className="w-full px-3 py-2.5 text-left transition-all"
                                    style={{
                                        color: '#fff',
                                        fontSize: '0.85rem',
                                        border: 'none',
                                        background: selectedTable === t.value ? 'rgba(141,23,24,0.45)' : 'transparent',
                                    }}
                                    onMouseEnter={(e) => { if (selectedTable !== t.value) e.currentTarget.style.background = 'rgba(141,23,24,0.25)'; }}
                                    onMouseLeave={(e) => { if (selectedTable !== t.value) e.currentTarget.style.background = 'transparent'; }}
                                >
                                    {t.label}
                                </button>
                            ))
                        ) : (
                            <p className="px-3 py-3 text-center" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>
                                No tables found
                            </p>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

export default F1SelectDataModal;