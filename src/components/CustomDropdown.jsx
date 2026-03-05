import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const CustomDropdown = ({
    value,
    onChange,
    options = [],
    placeholder = 'Select',
    className = '',
    disabled = false,
    label,
    error,
    borderColor = '#E5E7EB',
    bgColor = '#FFFFFF',
    focusColor = '#8e78b7',
    icon = true,
    optionClassName = '',
    panelClassName = '',
    rounded = 'lg',
    compact = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [openUpward, setOpenUpward] = useState(false);
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);
    const displayLabel = selectedOption?.label || placeholder;

    const handleSelect = (optionValue) => {
        onChange({ target: { value: optionValue } });
        setIsOpen(false);
    };

    const handleToggle = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen && inputRef.current && dropdownRef.current) {
                // Get the button's position relative to viewport
                const rect = inputRef.current.getBoundingClientRect();
                
                // Find the closest scrollable parent
                let scrollableParent = dropdownRef.current.parentElement;
                while (scrollableParent) {
                    const style = window.getComputedStyle(scrollableParent);
                    if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
                        break;
                    }
                    scrollableParent = scrollableParent.parentElement;
                }

                // If there's a scrollable parent, calculate space within it
                if (scrollableParent) {
                    const parentRect = scrollableParent.getBoundingClientRect();
                    const spaceBelow = parentRect.bottom - rect.bottom;
                    const spaceAbove = rect.top - parentRect.top;
                    const dropdownHeight = Math.min(options.length * 36 + 16, 240);
                    setOpenUpward(spaceBelow < dropdownHeight && spaceAbove > spaceBelow);
                } else {
                    // Fallback: use viewport if no scrollable parent
                    const spaceBelow = window.innerHeight - rect.bottom;
                    const spaceAbove = rect.top;
                    const dropdownHeight = Math.min(options.length * 36 + 16, 240);
                    setOpenUpward(spaceBelow < dropdownHeight && spaceAbove > spaceBelow);
                }
            }
        }
    };

    const roundedClass = {
        sm: 'rounded',
        md: 'rounded-md',
        lg: 'rounded-lg',
        xl: 'rounded-xl',
        '2xl': 'rounded-2xl',
        full: 'rounded-full',
    }[rounded] || 'rounded-lg';

    return (
        <div className="relative" ref={dropdownRef}>
            {label && <label className="block satoshi-14 mb-1">{label}</label>}
            
            <button
                ref={inputRef}
                onClick={handleToggle}
                className={`w-full text-left ${compact ? 'px-2 py-1' : 'px-3 py-2'} text-sm border transition-all duration-200 flex items-center justify-between ${roundedClass} ${
                    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-[#8e78b7] ${className}`}
                style={{
                    backgroundColor: bgColor,
                    borderColor: isOpen ? focusColor : borderColor,
                    height: compact ? '31px' : 'auto',
                    display: 'flex',
                    alignItems: 'center',
                }}
                disabled={disabled}
            >
                <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
                    {displayLabel}
                </span>
                {icon && (
                    <ChevronDown
                        className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                )}
            </button>

            {isOpen && (
                <div
                    className={`absolute left-0 right-0 bg-white shadow-lg z-50 ${roundedClass} overflow-hidden ${panelClassName}`}
                    style={{
                        minWidth: '100%',
                        ...(openUpward ? { bottom: '100%', marginBottom: '0' } : { top: '100%', marginTop: '0' })
                    }}
                >
                    <div className="max-h-60 overflow-y-auto">
                        {options.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500 text-center">
                                No options available
                            </div>
                        ) : (
                            options.map((option, idx) => (
                                <button
                                    key={`${option.value}-${idx}`}
                                    onClick={() => handleSelect(option.value)}
                                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                                        value === option.value
                                            ? 'bg-blue-50 text-blue-900 font-medium'
                                            : 'text-gray-700 hover:bg-gray-50'
                                    } ${optionClassName}`}
                                    style={{
                                        backgroundColor: value === option.value ? `${focusColor}15` : undefined,
                                        color: value === option.value ? focusColor : undefined,
                                    }}
                                >
                                    {option.label}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}

            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
};

export default CustomDropdown;
