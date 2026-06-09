
import React, { useEffect } from 'react';
const ChevronSVG = () => (
  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ColumnSearchableDropdown = ({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  label,
  searchValue,
  setSearchValue,
  showDropdown,
  setShowDropdown,
  id,
  hasError
}) => {
  const dropdownRef = React.useRef(null);
  const [openUpward, setOpenUpward] = React.useState(false);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(prev => ({ ...prev, [id]: false }));
      }
    };

    if (showDropdown[id]) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown, id, setShowDropdown]);

  const currentSearch = searchValue[id] || '';
  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(currentSearch.toLowerCase())
  );
  const displayValue = value || placeholder;

  return (
    <div className="relative" ref={dropdownRef}>
      {label && <label className="block text-xs text-gray-500 mb-1.5">{label}</label>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
  if (disabled) return;

  const nextState = !showDropdown[id];

  if (nextState && dropdownRef.current) {
    const rect = dropdownRef.current.getBoundingClientRect();

    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdownHeight = 260;

    setOpenUpward(spaceBelow < dropdownHeight);
  }

  setShowDropdown(prev => ({
    ...prev,
    [id]: nextState
  }));
}}
        className={`w-full px-3 py-2 border rounded-lg text-sm bg-white flex items-center justify-between focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
          disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-[#8e78b7]'
        } ${value ? 'text-gray-700' : hasError ? 'text-[#EF4D5F]' : 'text-gray-400'} ${
          hasError
            ? 'border-[#EF4D5F] bg-[#FFF7F8] focus:ring-red-300'
            : 'border-gray-300 focus:ring-[#8e78b7]'
        }`}
      >
        <span className={value ? 'text-gray-700' : hasError ? 'text-[#EF4D5F]' : 'text-gray-400'}>{displayValue}</span>
        <ChevronSVG />
      </button>

      {showDropdown[id] && !disabled && (
        <div
  className={`absolute z-50 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden ${
    openUpward
      ? 'bottom-full mb-1'
      : 'top-full mt-1'
  }`}
>
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              value={currentSearch}
              onChange={(e) => setSearchValue(prev => ({ ...prev, [id]: e.target.value }))}
              placeholder="Search..."
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent"
              autoFocus
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            <div
              onClick={() => {
                onChange('');
                setShowDropdown(prev => ({ ...prev, [id]: false }));
                setSearchValue(prev => ({ ...prev, [id]: '' }));
              }}
              className="px-3 py-2 text-sm text-gray-400 bg-[#FAFAFA] hover:bg-[#F3F4F6] cursor-pointer"
            >
              {placeholder}
            </div>
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <div
                  key={opt}
                  onClick={() => {
                    onChange(opt);
                    setShowDropdown(prev => ({ ...prev, [id]: false }));
                    setSearchValue(prev => ({ ...prev, [id]: '' }));
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-purple-50 ${value === opt ? 'bg-purple-50 text-[#8e78b7] font-medium' : 'text-gray-700'}`}
                >
                  {opt}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-400 text-center">No options found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};



export default ColumnSearchableDropdown;