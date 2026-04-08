import { useEffect, useRef, useState } from "react";
import { createPortal } from 'react-dom';
import { ChevronDown, Search } from 'lucide-react';

const SearchableDropdown = ({ value, onChange, options = [], placeholder = 'Select' }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [dropdownStyle, setDropdownStyle] = useState({});

    const buttonRef = useRef(null);
    const dropdownRef = useRef(null);

    const calculatePosition = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const dropdownHeight = 250;
            const openUpward = spaceBelow < dropdownHeight;

            const minDropdownWidth = Math.max(rect.width, 180);
            const leftPos = Math.min(rect.left, window.innerWidth - minDropdownWidth - 8);

            setDropdownStyle({
                position: 'fixed',
                top: openUpward ? undefined : rect.bottom + 4,
                bottom: openUpward ? window.innerHeight - rect.top + 4 : undefined,
                left: Math.max(8, leftPos),
                minWidth: minDropdownWidth,
                width: minDropdownWidth,
                zIndex: 99999,
            });
        }
    };

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

    useEffect(() => {
        if (!open) return;
        window.addEventListener('scroll', calculatePosition, true);
        window.addEventListener('resize', calculatePosition);
        return () => {
            window.removeEventListener('scroll', calculatePosition, true);
            window.removeEventListener('resize', calculatePosition);
        };
    }, [open]);

    const filtered = options.filter(o =>
        o.label.toLowerCase().includes(search.toLowerCase())
    );

    const selected = options.find(o => String(o.value) === String(value));

    const handleOpen = () => {
        calculatePosition();
        setOpen(prev => !prev);
        setSearch('');
    };

    const handleSelect = (opt) => {
        onChange(opt.value);
        setOpen(false);
        setSearch('');
    };

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                type="button"
                onClick={handleOpen}
                className="w-full border border-[#CCCCCC] rounded-lg px-3.5 py-2.5 text-sm font-normal outline-none bg-white font-[Satoshi,sans-serif] text-left flex items-center justify-between focus:border-[#8e78b7]"
                style={{ color: selected ? '#282F49' : '#A0AEC0' }}
            >
                <span className="truncate">{selected ? selected.label : placeholder}</span>
                <ChevronDown size={14} color="#818181" className="flex-shrink-0 ml-1" />
            </button>

            {open && createPortal(
                <div
                    ref={dropdownRef}
                    style={dropdownStyle}
                    className="bg-white border border-[#CCCCCC] rounded-lg shadow-lg overflow-hidden"
                >
                    <div className="px-3 py-2 border-b border-[#EEEEEE] flex items-center gap-2 sticky top-0 bg-white">
                        <Search size={13} color="#818181" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="flex-1 text-sm outline-none text-[#282F49] bg-transparent placeholder:text-[#A0AEC0] font-[Satoshi,sans-serif]"
                        />
                    </div>
                    <div className="max-h-44 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-[#A0AEC0]">No results</div>
                        ) : (
                            filtered.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => handleSelect(opt)}
                                    className={`w-full text-left px-3 py-2 text-sm font-[Satoshi,sans-serif] hover:bg-purple-50 transition-colors
                                        ${String(opt.value) === String(value)
                                            ? 'bg-[#F3EFFF] text-[#8e78b7] font-medium'
                                            : 'text-[#332849]'}`}
                                >
                                    {opt.label}
                                </button>
                            ))
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default SearchableDropdown;