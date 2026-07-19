
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
  hasError,
  showDescription = false
}) => {
  const dropdownRef = React.useRef(null);
  const [hoveredOption, setHoveredOption] = React.useState(null);

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
    opt.label.toLowerCase().includes(currentSearch.toLowerCase())
  );
  const selectedOption = options.find(
  opt => opt.value === value
);

const displayValue =
  selectedOption?.label || placeholder;

  return (
    <div className="relative" ref={dropdownRef}>
      {label && <label className="block text-xs text-gray-500 mb-1.5">{label}</label>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setShowDropdown(prev => ({ ...prev, [id]: !prev[id] }))}
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
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
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
    key={opt.value}
    className="relative"
    onMouseEnter={() => setHoveredOption(opt.value)}
    onMouseLeave={() => setHoveredOption(null)}
  >
    <div
      onClick={() => {
        onChange(opt.value);
        setShowDropdown(prev => ({ ...prev, [id]: false }));
        setSearchValue(prev => ({ ...prev, [id]: '' }));
      }}
      className={`px-3 py-2 text-sm cursor-pointer hover:bg-purple-50 ${
        value === opt.value
          ? 'bg-purple-50 text-[#8e78b7] font-medium'
          : 'text-gray-700'
      }`}
    >
      {opt.label}
    </div>

    {showDescription &&
      hoveredOption === opt.value &&
      opt.description && (
        <div className="absolute left-full top-0 ml-2 z-[9999] w-80 p-3 bg-[#332849] text-white text-xs rounded-lg shadow-lg">
          <div className="absolute left-[-4px] top-3 w-2 h-2 bg-[#332849] rotate-45" />
          {opt.description}
        </div>
      )}
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