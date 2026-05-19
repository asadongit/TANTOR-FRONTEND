import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X } from 'lucide-react';

const NamePaginatedSelect = ({
  label,
  value,
  options,
  field,
  onChange,
  pageSize = 10,
  isLoading = false,
  isDisabled = false,
  error,
  disabledReason,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredOptions = useMemo(
    () => options.filter((opt) => opt.label.toLowerCase().includes(searchTerm.toLowerCase())),
    [options, searchTerm]
  );

  const totalPages = Math.max(1, Math.ceil(filteredOptions.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * pageSize;
  const paginatedOptions = filteredOptions.slice(start, start + pageSize);
  const selectedOption = options.find((opt) => opt.value === value);
  const hasRealOptions = options.length > 0;

  return (
    <div ref={dropdownRef} className={`relative ${isOpen ? 'z-[80]' : 'z-40'}`}>
      <label className="block text-sm font-medium text-[#332849] mb-1.5" style={{ fontFamily: 'Satoshi, sans-serif' }}>
        {label}
      </label>

      <button
        type="button"
        onClick={() => { if (!isLoading && !isDisabled && hasRealOptions) { setIsOpen((prev) => !prev); } }}
        className={`w-full px-3 py-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7] cursor-pointer flex items-center justify-between ${(isLoading || isDisabled || !hasRealOptions) ? 'text-gray-400 cursor-not-allowed bg-gray-50' : 'text-[#332849]'} border-[#CCCCCC]`}
        style={{ fontFamily: 'Satoshi, sans-serif' }}
      >
        <span className={`${!value ? 'text-gray-500' : 'text-[#332849]'} truncate pr-2`}>
          {isLoading ? 'Loading...' : isDisabled && disabledReason ? disabledReason : !hasRealOptions ? 'Select' : (selectedOption?.label || 'Select')}
        </span>
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !isLoading && !isDisabled && hasRealOptions && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-[#CCCCCC] rounded-md shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search value..."
                className="w-full pl-8 pr-8 py-1.5 border border-[#CCCCCC] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
                style={{ fontFamily: 'Satoshi, sans-serif' }}
              />
              {searchTerm && (
                <button type="button" onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {paginatedOptions.length === 0 ? (
              <div className="px-3 py-3 text-sm text-gray-500 text-center">No values found</div>
            ) : (
              paginatedOptions.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => { onChange(field, opt.value); setIsOpen(false); }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-purple-50 ${value === opt.value ? 'bg-purple-100 text-[#8e78b7] font-medium' : 'text-[#332849]'}`}
                  style={{ fontFamily: 'Satoshi, sans-serif' }}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>

          <div className="px-3 py-2 border-t border-gray-200 flex items-center justify-between">
            <button type="button" onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={safePage === 1} className={`text-xs px-2 py-1 rounded ${safePage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-[#8e78b7] hover:bg-purple-50'}`} style={{ fontFamily: 'Satoshi, sans-serif' }}>
              Prev
            </button>

            <span className="text-xs text-gray-500" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              Page {safePage} of {totalPages}
            </span>

            <button type="button" onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} disabled={safePage === totalPages} className={`text-xs px-2 py-1 rounded ${safePage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-[#8e78b7] hover:bg-purple-50'}`} style={{ fontFamily: 'Satoshi, sans-serif' }}>
              Next
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default NamePaginatedSelect;
