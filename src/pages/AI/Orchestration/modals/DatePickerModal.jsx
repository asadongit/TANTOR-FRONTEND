import { useState } from "react";

const DatePickerModal = ({ 
    isOpen, 
    onClose, 
    onAdd
}) => {
    if (!isOpen) return null;

    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedHour, setSelectedHour] = useState('');
    const [selectedMinute, setSelectedMinute] = useState('');

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    const generateHours = () => {
        const hours = [];
        for (let hour = 0; hour < 24; hour++) {
            hours.push(String(hour).padStart(2, '0'));
        }
        return hours;
    };

    const generateMinutes = () => {
        const minutes = [];
        for (let minute = 0; minute < 60; minute++) {
            minutes.push(String(minute).padStart(2, '0'));
        }
        return minutes;
    };

    const hours = generateHours();
    const minutes = generateMinutes();

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

    const handleAddClick = () => {
        if (!selectedDate || !selectedHour || !selectedMinute) {
            return;
        }

        const dateTimeData = {
            date: selectedDate,
            month: selectedMonth,
            year: selectedYear,
            hour: selectedHour,
            minute: selectedMinute
        };

        onAdd(dateTimeData);

        setSelectedDate(null);
        setSelectedHour('');
        setSelectedMinute('');
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
                        <span className="text-xl">×</span>
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
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <select 
                                        value={selectedHour} 
                                        onChange={(e) => setSelectedHour(e.target.value)} 
                                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7] appearance-none"
                                    >
                                        <option value="">HH</option>
                                        {hours.map(hour => (
                                            <option key={hour} value={hour}>{hour}</option>
                                        ))}
                                    </select>
                                </div>
                                <span className="text-gray-500 font-medium">:</span>
                                <div className="relative flex-1">
                                    <select 
                                        value={selectedMinute} 
                                        onChange={(e) => setSelectedMinute(e.target.value)} 
                                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7] appearance-none"
                                    >
                                        <option value="">MM</option>
                                        {minutes.map(minute => (
                                            <option key={minute} value={minute}>{minute}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
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
                        onClick={handleAddClick} 
                        className="px-4 py-2 text-sm font-medium text-white bg-[#8e78b7] hover:bg-[#7d68a6] rounded transition-colors"
                    >
                        Add
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DatePickerModal;