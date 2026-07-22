import React, { useState, useRef, useEffect } from 'react';

const DesiredClassDropdown = ({ value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0, width: 0, placeAbove: false });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && !buttonRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const DROPDOWN_EST_HEIGHT = 210;
      const spaceBelow = window.innerHeight - rect.bottom;
      const positionAbove = spaceBelow < DROPDOWN_EST_HEIGHT;

      setPopupPosition({
        top: positionAbove ? rect.top - 4 : rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        placeAbove: positionAbove,
      });
    }
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt === value);
  const isEmptyValue = value === '' || value === null || value === undefined;
  const selectedLabel = selectedOption === undefined ? 'Select' : String(selectedOption);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="h-8 min-w-[90px] px-3 py-1 border rounded-md border-[#CCCCCC] bg-white text-[#332849] text-xs focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7] flex items-center justify-between whitespace-nowrap"
        style={{ fontFamily: 'Satoshi, sans-serif' }}
      >
        <span className={`${isEmptyValue ? 'text-gray-500' : 'text-[#332849]'}`}>
          {selectedLabel}
        </span>
        <svg className="w-3 h-3 text-gray-400 flex-shrink-0 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div 
          className="fixed z-[9999] bg-white border border-[#CCCCCC] rounded-md shadow-lg overflow-hidden"
          style={{
            top: `${popupPosition.top}px`,
            left: `${popupPosition.left}px`,
            width: `${popupPosition.width}px`,
            transform: popupPosition.placeAbove ? 'translateY(-100%)' : 'none',
          }}
        >
          <div className="max-h-48 overflow-y-auto">
            <button
              type="button"
              onClick={() => { onChange(''); setIsOpen(false); }}
              className={`w-full px-3 py-2 text-xs text-left transition-colors ${
                value === '' ? 'bg-[#F2ECFF] text-[#8e78b7] font-medium' : 'text-[#332849] hover:bg-[#F7F3FF]'
              }`}
              style={{ fontFamily: 'Satoshi, sans-serif' }}
            >
              Select
            </button>
            {options.map((option, index) => (
              <button
                key={`${String(option)}-${index}`}
                type="button"
                onClick={() => { onChange(option); setIsOpen(false); }}
                className={`w-full px-3 py-2 text-xs text-left transition-colors ${
                  value === option ? 'bg-[#F2ECFF] text-[#8e78b7] font-medium' : 'text-[#332849] hover:bg-[#F7F3FF]'
                }`}
                style={{ fontFamily: 'Satoshi, sans-serif' }}
              >
                {String(option)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DesiredClassDropdown;
