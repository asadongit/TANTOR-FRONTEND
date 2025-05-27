import React, { useState, useEffect } from "react";
import { Calendar, X } from "lucide-react";

const DateExpressionCalculator = ({ onClose, dateType, lowerOffset, upperOffset, lowerUnit, upperUnit }) => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [timeUnit, setTimeUnit] = useState(lowerUnit || "days");
  const [outputExpression, setOutputExpression] = useState("");

  const calculateDateFromOffset = (offset, unit) => {
    if (offset === null || offset === undefined) return null;
    
    const today = new Date();
    const offsetValue = parseFloat(offset);
    
    if (isNaN(offsetValue)) return null;
    
    const newDate = new Date(today);
    
    if (unit === "days") {
      newDate.setDate(today.getDate() + offsetValue);
    } else if (unit === "months") {
      newDate.setMonth(today.getMonth() + offsetValue);
    } else if (unit === "years") {
      newDate.setFullYear(today.getFullYear() + offsetValue);
    }
    
    return newDate;
  };
  
  const calculateOffsetFromDate = (date, unit) => {
    if (!date) return null;
    
    const today = new Date();
    // Set both dates to midnight to avoid time differences affecting day calculations
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    
    const diffMs = compareDate - today;
    
    if (unit === "days") {
      return Math.round(diffMs / (1000 * 60 * 60 * 24));
    } else if (unit === "months") {
      return ((date.getFullYear() - today.getFullYear()) * 12 + 
              date.getMonth() - today.getMonth() + 
              (date.getDate() - today.getDate()) / 30).toFixed(2);
    } else {
      return (diffMs / (1000 * 60 * 60 * 24 * 365.25)).toFixed(2);
    }
  };

  useEffect(() => {
    if (dateType === "historicDate" && lowerOffset && lowerUnit) {
      // Ensuring lowerOffset is negative for historicDate
      const offset = parseFloat(lowerOffset);
      if (offset > 0) {
        const calculatedDate = calculateDateFromOffset(-offset, lowerUnit);
        setStartDate(calculatedDate);
      } else {
        const calculatedDate = calculateDateFromOffset(lowerOffset, lowerUnit);
        setStartDate(calculatedDate);
      }
      setTimeUnit(lowerUnit);
    } else if (dateType === "dateRange") {
      if (lowerOffset && lowerUnit) {
        // For dateRange, lowerOffset can be positive or negative
        const lowerDate = calculateDateFromOffset(lowerOffset, lowerUnit);
        setStartDate(lowerDate);
        setTimeUnit(lowerUnit);
      }
      
      if (upperOffset && upperUnit) {
        const upperDate = calculateDateFromOffset(upperOffset, upperUnit);
        setEndDate(upperDate);
      }
    }
  }, [dateType, lowerOffset, upperOffset, lowerUnit, upperUnit]);

  useEffect(() => {
    if (!startDate) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateType === "historicDate") {
      const offset = calculateOffsetFromDate(startDate, timeUnit);
      setOutputExpression(`${offset}, ${timeUnit}`);
    } else if (dateType === "dateRange" && endDate) {
      const lowerOffset = calculateOffsetFromDate(startDate, timeUnit);
      
      const compareEndDate = new Date(endDate);
      compareEndDate.setHours(0, 0, 0, 0);
      const todayToUpperMs = compareEndDate - today;
      let upperOffset;
      
      if (timeUnit === "days") {
        upperOffset = Math.round(todayToUpperMs / (1000 * 60 * 60 * 24));
      } else if (timeUnit === "months") {
        upperOffset = ((endDate.getFullYear() - today.getFullYear()) * 12 + 
                       endDate.getMonth() - today.getMonth() + 
                       (endDate.getDate() - today.getDate()) / 30).toFixed(2);
      } else {
        upperOffset = (todayToUpperMs / (1000 * 60 * 60 * 24 * 365.25)).toFixed(2);
      }
      
      setOutputExpression(`${lowerOffset}, ${timeUnit}\n${upperOffset}, ${timeUnit}`);
    }
  }, [startDate, endDate, timeUnit, dateType]);

  const DatePicker = ({ label, value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    
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
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <button 
          className="w-full flex items-center gap-2 px-3 py-2 border border-gray-300 rounded bg-white text-left"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className={value ? "text-gray-900" : "text-gray-500"}>
            {value ? formatDate(value) : "Select date"}
          </span>
        </button>
        
        {isOpen && (
          <div className="absolute z-10 mt-1 bg-white shadow-lg border border-gray-200 rounded-md p-2">
            <div className="flex justify-between items-center mb-2">
              <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded">
                &lt;
              </button>
              <span className="font-medium">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded">
                &gt;
              </button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center">
              {dayNames.map(day => (
                <div key={day} className="text-xs text-gray-500">{day}</div>
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
                      className="h-8 w-8 rounded hover:bg-gray-100 text-sm"
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
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="mb-4 flex items-center">
            <span className="text-sm text-gray-700 mr-2">Current Mode: </span>
            <span className="font-medium">{dateType === "historicDate" ? "Historic Date" : "Date Range"}</span>
          </div>
          
          <div className="space-y-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Unit
              </label>
              <select
                value={timeUnit}
                onChange={(e) => setTimeUnit(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
              >
                <option value="days">Days</option>
                <option value="months">Months</option>
                <option value="years">Years</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Output Expression{dateType === "dateRange" ? "s" : ""}
              </label>
              <textarea
                readOnly
                value={outputExpression}
                className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50 h-20"
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