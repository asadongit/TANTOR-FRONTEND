import React, { useState, useEffect } from "react";
import { Calendar, X } from "lucide-react";

const DateExpressionCalculator = ({ onClose, dateType, lowerOffset, upperOffset, lowerUnit, upperUnit }) => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [timeUnit, setTimeUnit] = useState(lowerUnit || "days");
  const [outputExpression, setOutputExpression] = useState("");

  const calculateDateFromOffset = (offset, unit, refDate = referenceDate) => {
    if (offset === null || offset === undefined) return null;
    
    const offsetValue = parseFloat(offset);
    if (isNaN(offsetValue)) return null;
    
    const baseDate = new Date(refDate);
    const newDate = new Date(baseDate);
    
    if (unit === "days") {
      newDate.setDate(baseDate.getDate() + offsetValue);
    } else if (unit === "months") {
      newDate.setMonth(baseDate.getMonth() + offsetValue);
    } else if (unit === "years") {
      newDate.setFullYear(baseDate.getFullYear() + offsetValue);
    }
    
    return newDate;
  };
  
  const calculateOffsetFromDate = (date, unit, refDate = referenceDate) => {
    if (!date || !refDate) return null;
    
    const refDateCopy = new Date(refDate);
    refDateCopy.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    
    const diffMs = compareDate - refDateCopy;
    
    if (unit === "days") {
      return Math.round(diffMs / (1000 * 60 * 60 * 24));
    } else if (unit === "months") {
      const months = (compareDate.getFullYear() - refDateCopy.getFullYear()) * 12 + 
                    compareDate.getMonth() - refDateCopy.getMonth();
      return months;
    } else {
      return Math.round(diffMs / (1000 * 60 * 60 * 24 * 365.25));
    }
  };

  useEffect(() => {
    if (dateType === "historicDate" && lowerOffset && lowerUnit) {
      const offset = parseFloat(lowerOffset);
      const calculatedDate = calculateDateFromOffset(
        offset > 0 ? -offset : offset, 
        lowerUnit,
        referenceDate
      );
      setStartDate(calculatedDate);
      setTimeUnit(lowerUnit);
    } else if (dateType === "dateRange") {
      if (lowerOffset && lowerUnit) {
        setStartDate(calculateDateFromOffset(lowerOffset, lowerUnit, referenceDate));
        setTimeUnit(lowerUnit);
      }
      if (upperOffset && upperUnit) {
        setEndDate(calculateDateFromOffset(upperOffset, upperUnit, referenceDate));
      }
    }
  }, [dateType, lowerOffset, upperOffset, lowerUnit, upperUnit, referenceDate]);

  useEffect(() => {
    if (!startDate || !referenceDate) return;
    
    if (dateType === "historicDate") {
      const offset = calculateOffsetFromDate(startDate, timeUnit, referenceDate);
      setOutputExpression(`${offset}, ${timeUnit}`);
    } else if (dateType === "dateRange" && endDate) {
      const lowerOffset = calculateOffsetFromDate(startDate, timeUnit, referenceDate);
      const upperOffset = calculateOffsetFromDate(endDate, timeUnit, referenceDate);
      setOutputExpression(`${lowerOffset}, ${timeUnit}\n${upperOffset}, ${timeUnit}`);
    }
  }, [startDate, endDate, timeUnit, dateType, referenceDate]);

  const DatePicker = ({ label, value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(value || new Date());
    
    const monthNames = ["January", "February", "March", "April", "May", "June", 
                      "July", "August", "September", "October", "November", "December"];
    const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    
    const formatDate = (date) => {
      if (!date) return "Select date";
      return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
      });
    };
    
    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
    
    const handleDateSelect = (day) => {
      const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      onChange(selectedDate);
      setIsOpen(false);
    };
    
    const prevMonth = () => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };
    
    const nextMonth = () => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    return (
      <div className="w-full relative">
        <label className="block text-sm font-medium text-gray-900 mb-1">{label}</label>
        <button 
          className="w-full flex items-center gap-2 px-3 py-2 border border-gray-300 rounded bg-white text-left"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Calendar className="h-4 w-4 text-gray-600" />
          <span className={value ? "text-gray-900" : "text-gray-600"}>
            {formatDate(value)}
          </span>
        </button>
        
        {isOpen && (
          <div className="absolute z-10 mt-1 bg-white shadow-lg border border-gray-200 rounded-md p-2">
            <div className="flex justify-between items-center mb-2">
              <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded text-gray-900">
                &lt;
              </button>
              <span className="font-medium text-gray-900">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded text-gray-900">
                &gt;
              </button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center">
              {dayNames.map(day => (
                <div key={day} className="text-xs text-gray-700 font-medium">{day}</div>
              ))}
              
              {Array(firstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth()))
                .fill(null)
                .map((_, i) => <div key={`empty-${i}`} />)}
              
              {Array(daysInMonth(currentMonth.getFullYear(), currentMonth.getMonth()))
                .fill(null)
                .map((_, i) => {
                  const day = i + 1;
                  return (
                    <button
                      key={day}
                      className="h-8 w-8 rounded hover:bg-gray-100 text-sm text-gray-900 hover:text-gray-900"
                      onClick={() => handleDateSelect(day)}
                    >
                      {day}
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[9999] bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Date Expression Calculator</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="mb-4 flex items-center">
            <span className="text-sm text-gray-900 mr-2">Current Mode: </span>
            <span className="font-medium text-gray-900">{dateType === "historicDate" ? "Historic Date" : "Date Range"}</span>
          </div>
          
          <div className="space-y-4">
            <DatePicker 
              label="Reference Date" 
              value={referenceDate} 
              onChange={setReferenceDate} 
            />
            
            <DatePicker 
              label={dateType === "historicDate" ? "Historic Date" : "Lower Offset Date"} 
              value={startDate} 
              onChange={setStartDate} 
            />
            
            {dateType === "dateRange" && (
              <DatePicker 
                label="Upper Offset Date" 
                value={endDate} 
                onChange={setEndDate} 
              />
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Time Unit
              </label>
              <select
                value={timeUnit}
                onChange={(e) => setTimeUnit(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-gray-900"
              >
                <option value="days">Days</option>
                <option value="months">Months</option>
                <option value="years">Years</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Output Expression{dateType === "dateRange" ? "s" : ""}
              </label>
              <textarea
                readOnly
                value={outputExpression}
                className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50 h-20 text-gray-900"
                placeholder={dateType === "historicDate" 
                  ? "Historic date expression will appear here" 
                  : "Lower and upper offset expressions will appear here"}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateExpressionCalculator;