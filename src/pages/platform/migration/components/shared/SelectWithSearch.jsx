import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const SelectWithSearch = ({ options, placeholder, labelKey, valueKey, onSelect, value, disabled, isLoading, loadingText }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  const filteredOptions = options.filter(option =>
    option[labelKey]?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option) => {
    onSelect(option);
    setSearchTerm(option[labelKey]);
    setIsOpen(false);
  };

  useEffect(() => {
    if (value) {
      const selectedOption = options.find(opt => opt[valueKey] === value);
      setSearchTerm(selectedOption ? selectedOption[labelKey] : '');
    } else {
      setSearchTerm('');
    }
  }, [value, options, labelKey, valueKey]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm bg-gray-100">
        {loadingText}
      </div>
    );
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        type="text"
        className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
      />
      {!disabled && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      )}
      {isOpen && filteredOptions.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
          {filteredOptions.map((option, idx) => (
            <li
              key={idx}
              className="px-3 py-2 hover:bg-purple-50 cursor-pointer text-sm"
              onClick={() => handleSelect(option)}
            >
              {option[labelKey]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SelectWithSearch;
