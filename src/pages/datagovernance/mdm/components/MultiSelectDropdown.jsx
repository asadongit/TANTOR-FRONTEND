import { useEffect, useRef, useState } from "react";
import { createPortal } from 'react-dom';
import { ChevronDown, Search } from 'lucide-react';

const MultiSelectDropdown = ({ selectedIds = [], onToggle, onSelectAll, options = [] }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [dropdownStyle, setDropdownStyle] = useState({});

    const buttonRef = useRef(null);
    const dropdownRef = useRef(null);

    // ✅ Fix: close only when click is outside BOTH the trigger button AND the portal dropdown
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            const clickedButton = buttonRef.current?.contains(e.target);
            const clickedDropdown = dropdownRef.current?.contains(e.target);
            if (!clickedButton && !clickedDropdown) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const filtered = options.filter(r =>
        r.rule_name.toLowerCase().includes(search.toLowerCase())
    );

    const allSelected = options.length > 0 && selectedIds.length === options.length;

    const handleOpen = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const dropdownHeight = 260;
            const openUpward = spaceBelow < dropdownHeight;

            // ✅ Fix: added upward positioning (was missing in original)
            setDropdownStyle({
                position: 'fixed',
                top: openUpward ? undefined : rect.bottom + 4,
                bottom: openUpward ? window.innerHeight - rect.top + 4 : undefined,
                left: rect.left,
                width: rect.width,
                zIndex: 99999,
            });
        }
        setOpen(prev => !prev);
        setSearch('');
    };

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                type="button"
                onClick={handleOpen}
                className="w-full border border-[#CCCCCC] rounded-lg px-3.5 py-2.5 text-sm font-normal outline-none bg-white font-[Satoshi,sans-serif] text-left flex items-center justify-between focus:border-[#8e78b7]"
                style={{ color: selectedIds.length === 0 ? '#A0AEC0' : '#282F49' }}
            >
                <span>
                    {selectedIds.length === 0
                        ? 'Select'
                        : `${selectedIds.length} selected`}
                </span>
                <ChevronDown size={14} color="#818181" className="flex-shrink-0 ml-1" />
            </button>

            {open && createPortal(
                <div
                    ref={dropdownRef}
                    style={dropdownStyle}
                    className="bg-white border border-[#CCCCCC] rounded-lg shadow-lg overflow-hidden"
                >
                    {/* Search */}
                    <div className="px-3 py-2 border-b border-[#EEEEEE] flex items-center gap-2 bg-white">
                        <Search size={13} color="#818181" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Search rules..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="flex-1 text-sm outline-none text-[#282F49] bg-transparent placeholder:text-[#A0AEC0] font-[Satoshi,sans-serif]"
                        />
                    </div>

                    {/* Select All */}
                    <label className="flex items-center gap-2 px-3 py-2 border-b border-[#EEEEEE] hover:bg-purple-50 cursor-pointer text-sm font-medium text-[#8e78b7] bg-white">
                        <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={() => onSelectAll(selectedIds)}
                            className="accent-[#8e78b7]"
                        />
                        {allSelected ? 'Unselect All' : 'Select All'}
                    </label>

                    {/* Options */}
                    <div className="max-h-40 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-[#A0AEC0]">No results</div>
                        ) : (
                            filtered.map(rule => (
                                <label
                                    key={rule.rule_id}
                                    className="flex items-center gap-2 px-3 py-2 hover:bg-purple-50 cursor-pointer text-sm text-[#332849] font-[Satoshi,sans-serif]"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(rule.rule_id)}
                                        onChange={() => onToggle(rule.rule_id)}
                                        className="accent-[#8e78b7]"
                                    />
                                    {rule.rule_name}
                                </label>
                            ))
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default MultiSelectDropdown;