import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

const SearchableSelect = ({ label, value, options, field, onChange, isLoading = false, isDisabled = false, error, disabledReason }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find((opt) => opt.value === value);
  const hasRealOptions = options.length > 1 || (options.length === 1 && options[0].value !== '');

  return (
    <div ref={dropdownRef} className={`relative ${isOpen ? 'z-[80]' : 'z-40'}`}>
      <label className="block text-sm font-medium text-[#332849] mb-1.5" style={{ fontFamily: 'Satoshi, sans-serif' }}>
        {label}
      </label>

      <div
        onClick={() => { if (!isLoading && !isDisabled && hasRealOptions) { setIsOpen((prev) => !prev); } }}
        className={`w-full px-3 py-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7] cursor-pointer flex items-center justify-between ${error ? 'border-red-500' : 'border-[#CCCCCC]'} ${(isLoading || isDisabled || !hasRealOptions) ? 'text-gray-400 cursor-not-allowed bg-gray-50' : 'text-[#332849]'}`}
        style={{ fontFamily: 'Satoshi, sans-serif' }}
      >
        <span className={`${!value ? 'text-gray-500' : ''} truncate pr-2`}>
          {isLoading ? 'Loading...' : isDisabled && disabledReason ? disabledReason : !options.length ? 'Select' : (selectedOption?.label || 'Select')}
        </span>
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {isOpen && !isLoading && !isDisabled && hasRealOptions && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-[#CCCCCC] rounded-md shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-8 py-1.5 border border-[#CCCCCC] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
                style={{ fontFamily: 'Satoshi, sans-serif' }}
                onClick={(e) => e.stopPropagation()}
              />
              {searchTerm && (
                <button
                  onClick={(e) => { e.stopPropagation(); setSearchTerm(''); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">No results found</div>
            ) : (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => { onChange(field, opt.value); setIsOpen(false); setSearchTerm(''); }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-purple-50 ${value === opt.value ? 'bg-purple-100 text-[#8e78b7] font-medium' : 'text-[#332849]'}`}
                  style={{ fontFamily: 'Satoshi, sans-serif' }}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
