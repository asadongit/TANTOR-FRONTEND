import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

export const SearchableDropdown = ({
  selectedColumn,
  onSelect,
  availableOptions,
  placeholder = "Select column",
  readonly,
  dropDirection = "down",
  hasError = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const filteredOptions = availableOptions.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (option) => {
    if (!readonly) {
      onSelect(option);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        disabled={readonly}
        onClick={() => !readonly && setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border rounded-lg text-sm text-left focus:outline-none focus:ring-2 focus:border-transparent bg-white flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
          hasError
            ? 'border-[#EF4D5F] bg-[#FFF7F8] focus:ring-red-300'
            : 'border-gray-300 focus:ring-[#8e78b7]'
        }`}
      >
        <span className={selectedColumn ? "text-gray-700" : hasError ? "text-[#EF4D5F]" : "text-gray-400"}>
          {selectedColumn || placeholder}
        </span>
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !readonly && (
        <div className={`absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden ${dropDirection === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-48">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 transition-colors text-gray-700"
                >
                  {option}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const MultiSelectDropdown = ({
  selectedColumns = [],
  onSelectionChange,
  availableOptions,
  placeholder = "Search and select column...",
  readonly,
  dropDirection = "down",
  hasError = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const filteredOptions = availableOptions.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allFilteredSelected = filteredOptions.length > 0 && filteredOptions.every(o => selectedColumns.includes(o));
  const someFilteredSelected = filteredOptions.some(o => selectedColumns.includes(o));

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

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const toggleOption = (option) => {
    if (readonly) return;
    if (selectedColumns.includes(option)) {
      onSelectionChange(selectedColumns.filter(c => c !== option));
    } else {
      onSelectionChange([...selectedColumns, option]);
    }
  };

  const toggleSelectAll = () => {
    if (readonly) return;
    if (allFilteredSelected) {
      onSelectionChange(selectedColumns.filter(c => !filteredOptions.includes(c)));
    } else {
      const merged = [...new Set([...selectedColumns, ...filteredOptions])];
      onSelectionChange(merged);
    }
  };

  const triggerLabel = selectedColumns.length === 0
    ? placeholder
    : selectedColumns.length === 1
      ? selectedColumns[0]
      : `${selectedColumns.length} columns selected`;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        disabled={readonly}
        onClick={() => !readonly && setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border rounded-lg text-sm text-left focus:outline-none focus:ring-2 focus:border-transparent bg-white flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
          hasError
            ? 'border-[#EF4D5F] bg-[#FFF7F8] focus:ring-red-300'
            : 'border-gray-300 focus:ring-[#8e78b7]'
        }`}
      >
        <span className={selectedColumns.length > 0 ? 'text-gray-700' : hasError ? 'text-[#EF4D5F]' : 'text-gray-400'}>
          {triggerLabel}
        </span>
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !readonly && (
        <div className={`absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-lg overflow-hidden ${dropDirection === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent"
              />
            </div>
          </div>

          {filteredOptions.length > 0 && (
            <div className="border-b border-gray-100">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-gray-50 transition-colors"
              >
                <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                  allFilteredSelected || someFilteredSelected ? 'bg-[#8e78b7] border-[#8e78b7]' : 'border-gray-300 bg-white'
                }`}>
                  {allFilteredSelected ? (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : someFilteredSelected ? (
                    <span className="w-2 h-0.5 bg-white rounded" />
                  ) : null}
                </span>
                <span className="font-medium text-gray-700">Select All</span>
                <span className="ml-auto text-xs text-gray-400">
                  {selectedColumns.length}/{availableOptions.length + selectedColumns.length}
                </span>
              </button>
            </div>
          )}

          <div className="overflow-y-auto max-h-44">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = selectedColumns.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleOption(option)}
                    className="w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-gray-50 transition-colors"
                  >
                    <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'bg-[#8e78b7] border-[#8e78b7]' : 'border-gray-300 bg-white'}`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span className="text-gray-700">{option}</span>
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const SelectedColumnsList = ({ columns, onRemove, readonly }) => {
  if (columns.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {columns.map(column => (
        <span
          key={column}
          className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 text-gray-700 text-sm rounded-md"
        >
          {column}
          {!readonly && (
            <button type="button" onClick={() => onRemove(column)} className="ml-1 text-gray-500 hover:text-gray-700">
              <X className="w-3 h-3" />
            </button>
          )}
        </span>
      ))}
    </div>
  );
};

export default SearchableDropdown;
