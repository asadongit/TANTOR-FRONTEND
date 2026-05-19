import React, { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';

const CalendarDropdownField = ({ label, value, onChange, minDate, isDisabled = false, enforceMinDate = false, disabledReason }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayMonth, setDisplayMonth] = useState(() => {
    const base = value ? new Date(`${value}T00:00:00`) : new Date();
    return base.getMonth();
  });
  const [displayYear, setDisplayYear] = useState(() => {
    const base = value ? new Date(`${value}T00:00:00`) : new Date();
    return base.getFullYear();
  });
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => { if (isDisabled) setIsOpen(false); }, [isDisabled]);

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const formatDisplayDate = (isoDate) => {
    if (!isoDate) return 'dd-mm-yyyy';
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
  };

  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDay = (month, year) => new Date(year, month, 1).getDay();

  const minDateObj = minDate ? new Date(`${minDate}T00:00:00`) : null;
  const selectedDateObj = value ? new Date(`${value}T00:00:00`) : null;

  const handlePreviousMonth = () => {
    if (displayMonth === 0) { setDisplayMonth(11); setDisplayYear((prev) => prev - 1); }
    else { setDisplayMonth((prev) => prev - 1); }
  };

  const handleNextMonth = () => {
    if (displayMonth === 11) { setDisplayMonth(0); setDisplayYear((prev) => prev + 1); }
    else { setDisplayMonth((prev) => prev + 1); }
  };

  const renderDayCells = () => {
    const cells = [];
    const firstDay = getFirstDay(displayMonth, displayYear);
    const daysCount = getDaysInMonth(displayMonth, displayYear);

    for (let i = 0; i < firstDay; i += 1) cells.push(<div key={`empty-${i}`} className="h-9" />);

    for (let day = 1; day <= daysCount; day += 1) {
      const current = new Date(displayYear, displayMonth, day);
      current.setHours(0,0,0,0);
      const isDisabledCell = minDateObj ? (enforceMinDate ? current <= minDateObj : current < minDateObj) : false;
      const isSelected = selectedDateObj ? current.getTime() === selectedDateObj.getTime() : false;

      cells.push(
        <button
          key={day}
          type="button"
          disabled={isDisabledCell}
          onClick={() => { const yyyy = String(displayYear); const mm = String(displayMonth + 1).padStart(2,'0'); const dd = String(day).padStart(2,'0'); onChange(`${yyyy}-${mm}-${dd}`); setIsOpen(false); }}
          className={`h-9 rounded-md text-sm transition-colors ${isDisabledCell ? 'text-gray-300 cursor-not-allowed' : isSelected ? 'bg-[#8e78b7] text-white font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}
        >{day}</button>
      );
    }

    return cells;
  };

  const yearOptions = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 1 + i);

  return (
    <div ref={containerRef} className={`relative ${isOpen ? 'z-[80]' : 'z-40'}`}>
      <label className="block text-sm font-medium text-[#332849] mb-1.5" style={{ fontFamily: 'Satoshi, sans-serif' }}>{label}</label>

      <button type="button" onClick={() => { if (!isDisabled) setIsOpen((prev) => !prev); }} className={`w-full px-3 py-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7] cursor-pointer flex items-center justify-between ${isDisabled ? 'text-gray-400 cursor-not-allowed bg-gray-50' : 'text-[#332849]'} border-[#CCCCCC]`} style={{ fontFamily: 'Satoshi, sans-serif' }}>
        <span className={`${isDisabled ? 'text-gray-400' : value ? 'text-[#332849]' : 'text-gray-500'}`}>{isDisabled && disabledReason ? disabledReason : formatDisplayDate(value)}</span>
        <Calendar className="h-4 w-4 text-gray-400" />
      </button>

      {isOpen && !isDisabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-[#CCCCCC] rounded-md shadow-lg p-3">
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={handlePreviousMonth} className="text-gray-600 hover:text-gray-900 px-1">{'<'}</button>

            <div className="flex items-center gap-2">
              <select value={displayMonth} onChange={(e) => setDisplayMonth(Number(e.target.value))} className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7]">
                {monthNames.map((month, idx) => (<option key={month} value={idx}>{month}</option>))}
              </select>

              <select value={displayYear} onChange={(e) => setDisplayYear(Number(e.target.value))} className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7]">
                {yearOptions.map((year) => (<option key={year} value={year}>{year}</option>))}
              </select>
            </div>

            <button type="button" onClick={handleNextMonth} className="text-gray-600 hover:text-gray-900 px-1">{'>'}</button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">{dayNames.map((day) => (<div key={day} className="text-[11px] text-gray-500 text-center font-medium">{day}</div>))}</div>
          <div className="grid grid-cols-7 gap-1">{renderDayCells()}</div>
        </div>
      )}
    </div>
  );
};

export default CalendarDropdownField;
