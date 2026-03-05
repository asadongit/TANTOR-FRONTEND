import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const StatusFilterDropdown = ({ selectedStatuses, onStatusChange, statusOptions }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleStatusToggle = (statusValue) => {
    const newSelected = selectedStatuses.includes(statusValue)
      ? selectedStatuses.filter(s => s !== statusValue)
      : [...selectedStatuses, statusValue];

    // Ensure at least one status is selected
    if (newSelected.length === 0) {
      return;
    }

    onStatusChange(newSelected);
  };

  const getDisplayText = () => {
    if (selectedStatuses.length === 0) return 'Select Status';
    if (selectedStatuses.length === 1) {
      const status = statusOptions.find(opt => opt.value === selectedStatuses[0]);
      return status ? status.label : 'Select Status';
    }
    return `${selectedStatuses.length} Selected`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 border border-gray-300 rounded-lg text-sm px-3 bg-white flex items-center justify-between min-w-[120px]"
        title="Filter by Status"
      >
        <span style={{ color: '#818181' }}>{getDisplayText()}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} style={{ color: '#818181', fontWeight: 'bold' }} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-1 min-w-[120px] bg-white border border-gray-300 rounded-lg shadow-lg z-20">
            {statusOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedStatuses.includes(option.value)}
                  onChange={() => handleStatusToggle(option.value)}
                  className="mr-2 h-4 w-4 accent-[#8E77BB] border-gray-300 rounded focus:ring-[#8e78b7]"
                />
                <span className="text-sm" style={{ color: '#818181' }}>{option.label}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default StatusFilterDropdown;
