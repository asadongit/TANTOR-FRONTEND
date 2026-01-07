import { ChevronLeft, Calendar, X } from 'lucide-react';
import { useState } from 'react';

const DatePickerModal = ({ 
    isOpen, 
    onClose, 
    selectedDate, 
    setSelectedDate,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    formData,
    handleInputChange,
    onAdd
}) => {
    if (!isOpen) return null;

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    const getDaysInMonth = (month, year) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (month, year) => {
        return new Date(year, month, 1).getDay();
    };

    const handlePreviousMonth = () => {
        if (selectedMonth === 0) {
            setSelectedMonth(11);
            setSelectedYear(selectedYear - 1);
        } else {
            setSelectedMonth(selectedMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (selectedMonth === 11) {
            setSelectedMonth(0);
            setSelectedYear(selectedYear + 1);
        } else {
            setSelectedMonth(selectedMonth + 1);
        }
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
        const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);
        const days = [];
        const today = new Date();
        const currentDay = today.getDate();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-8"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const isSelected = selectedDate === day;
            const isPast = selectedYear < currentYear || 
                          (selectedYear === currentYear && selectedMonth < currentMonth) ||
                          (selectedYear === currentYear && selectedMonth === currentMonth && day < currentDay);
            
            days.push(
                <button
                    key={day}
                    onClick={() => !isPast && setSelectedDate(day)}
                    disabled={isPast}
                    className={`h-8 w-8 flex items-center justify-center text-sm rounded transition-colors ${
                        isPast 
                            ? 'text-gray-300 cursor-not-allowed' 
                            : isSelected
                                ? 'bg-[#8e78b7] text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                        }`}
                >
                    {day}
                </button>
            );
        }

        return days;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Select Custom date & time</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-4">
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                        <div className="flex items-center justify-between mb-3">
                            <button onClick={handlePreviousMonth} className="text-gray-600 hover:text-gray-900 p-1">
                                &lt;
                            </button>
                            <span className="text-sm font-medium text-gray-900">{monthNames[selectedMonth]} {selectedYear}</span>
                            <button onClick={handleNextMonth} className="text-gray-600 hover:text-gray-900 p-1">
                                &gt;
                            </button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                <div key={day} className="text-xs text-gray-500 text-center font-medium">{day}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                            <input 
                                type="text" 
                                value={selectedDate ? `${String(selectedDate).padStart(2, '0')}/${String(selectedMonth + 1).padStart(2, '0')}/${selectedYear}` : ''} 
                                readOnly 
                                placeholder="DD/MM/YYYY" 
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 bg-white" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Run Time</label>
                            <select 
                                value={formData.runTime} 
                                onChange={(e) => handleInputChange('runTime', e.target.value)} 
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
                            >
                                <option value="">Select</option>
                                <option value="00:00">00:00</option>
                                <option value="01:00">01:00</option>
                                <option value="02:00">02:00</option>
                                <option value="06:00">06:00</option>
                                <option value="12:00">12:00</option>
                                <option value="18:00">18:00</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onAdd} 
                        className="px-4 py-2 text-sm font-medium text-white bg-[#8e78b7] hover:bg-[#7d68a6] rounded transition-colors"
                    >
                        Add
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DatePickerModal