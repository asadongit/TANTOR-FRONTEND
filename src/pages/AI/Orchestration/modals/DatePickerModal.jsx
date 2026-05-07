import { useState } from "react";

const DatePickerModal = ({
    isOpen,
    onClose,
    onAdd
}) => {
    if (!isOpen) return null;
    const getISTDate = () => {
    const now = new Date(); 

    return new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
};

    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(getISTDate().getMonth());
    const [selectedYear, setSelectedYear] = useState(getISTDate().getFullYear());
    const [selectedHour, setSelectedHour] = useState('');
    const [selectedMinute, setSelectedMinute] = useState('');

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    const generateYears = () => {
        const currentYear = getISTDate().getFullYear();
        const years = [];
        for (let year = currentYear; year <= currentYear + 10; year++) {
            years.push(year);
        }
        return years;
    };

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

    const getDaysInMonth = (month, year) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (month, year) => {
        return new Date(year, month, 1).getDay();
    };

    const isToday = () => {
        const today = getISTDate();
        return selectedDate === today.getDate() &&
            selectedMonth === today.getMonth() &&
            selectedYear === today.getFullYear();
    };

    const getAvailableHours = () => {
        const allHours = generateHours();

        if (!isToday()) {
            return allHours;
        }

        const now = getISTDate();
        const currentHour = now.getHours();

        return allHours.filter(hour => parseInt(hour) >= currentHour);
    };

    const getAvailableMinutes = () => {
        const allMinutes = generateMinutes();

        if (!isToday() || !selectedHour) {
            return allMinutes;
        }

        const now = getISTDate();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const selectedHourNum = parseInt(selectedHour);

        if (selectedHourNum === currentHour) {
            return allMinutes.filter(minute => parseInt(minute) > currentMinute);
        }

        return allMinutes;
    };

    const handlePreviousMonth = () => {
        if (selectedMonth === 0) {
            setSelectedMonth(11);
            setSelectedYear(selectedYear - 1);
        } else {
            setSelectedMonth(selectedMonth - 1);
        }
        setSelectedDate(null);
    };

    const handleNextMonth = () => {
        if (selectedMonth === 11) {
            setSelectedMonth(0);
            setSelectedYear(selectedYear + 1);
        } else {
            setSelectedMonth(selectedMonth + 1);
        }
        setSelectedDate(null);
    };

    const handleMonthChange = (month) => {
        setSelectedMonth(parseInt(month));
        setSelectedDate(null);
    };

    const handleYearChange = (year) => {
        setSelectedYear(parseInt(year));
        setSelectedDate(null);
    };

    const handleDateSelect = (day) => {
        setSelectedDate(day);
        setSelectedHour('');
        setSelectedMinute('');
    };

    const handleHourChange = (hour) => {
        setSelectedHour(hour);
        if (selectedMinute) {
            const availableMinutes = getAvailableMinutes();
            if (!availableMinutes.includes(selectedMinute)) {
                setSelectedMinute('');
            }
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
        const today = getISTDate();
        const currentDay = today.getDate();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-11"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const isSelected = selectedDate === day;
            const isPast = selectedYear < currentYear ||
                (selectedYear === currentYear && selectedMonth < currentMonth) ||
                (selectedYear === currentYear && selectedMonth === currentMonth && day < currentDay);

            const isCurrentDay = selectedYear === currentYear &&
                selectedMonth === currentMonth &&
                day === currentDay;

            days.push(
                <button
                    key={day}
                    onClick={() => !isPast && handleDateSelect(day)}
                    disabled={isPast}
                    className={`h-11 w-11 flex items-center justify-center text-sm rounded-lg transition-all duration-150
                        ${isPast
                            ? 'text-gray-300 cursor-not-allowed'
                            : isSelected
                                ? 'bg-[#8e78b7] text-white font-semibold shadow-md'
                                : isCurrentDay
                                    ? 'bg-gray-100 text-gray-900 font-medium border border-gray-300'
                                    : 'text-gray-700 hover:bg-gray-100 font-medium'
                        }`}
                >
                    {day}
                </button>
            );
        }

        return days;
    };

    const availableHours = getAvailableHours();
    const availableMinutes = getAvailableMinutes();
    const years = generateYears();

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <style>
                {`
                    .month-year-select {
                        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
                        background-position: right 0.5rem center;
                        background-repeat: no-repeat;
                        background-size: 1.5em 1.5em;
                    }
                    .time-select {
                        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
                        background-position: right 0.5rem center;
                        background-repeat: no-repeat;
                        background-size: 1.5em 1.5em;
                    }
                `}
            </style>

            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Select Custom Date & Time</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-5">
                            <button
                                onClick={handlePreviousMonth}
                                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg p-2 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>

                            <div className="flex items-center gap-3">
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => handleMonthChange(e.target.value)}
                                    className="month-year-select pl-4 pr-10 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent cursor-pointer appearance-none"
                                >
                                    {monthNames.map((month, index) => (
                                        <option key={index} value={index}>{month}</option>
                                    ))}
                                </select>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => handleYearChange(e.target.value)}
                                    className="month-year-select pl-4 pr-10 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent cursor-pointer appearance-none"
                                >
                                    {years.map((year) => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={handleNextMonth}
                                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg p-2 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        <div className="grid grid-cols-7 gap-2 mb-3">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                <div key={day} className="text-xs font-semibold text-gray-600 text-center">
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-2">
                            {renderCalendar()}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Schedule Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={selectedDate ? `${String(selectedDate).padStart(2, '0')}/${String(selectedMonth + 1).padStart(2, '0')}/${selectedYear}` : ''}
                                readOnly
                                placeholder="DD/MM/YYYY"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Run Time <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center gap-2">
                                <select
                                    value={selectedHour}
                                    onChange={(e) => handleHourChange(e.target.value)}
                                    className="time-select flex-1 pl-3 pr-9 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent appearance-none cursor-pointer"
                                >
                                    <option value="">HH</option>
                                    {availableHours.map(hour => (
                                        <option key={hour} value={hour}>{hour}</option>
                                    ))}
                                </select>
                                <span className="text-gray-500 font-medium">:</span>
                                <select
                                    value={selectedMinute}
                                    onChange={(e) => setSelectedMinute(e.target.value)}
                                    className="time-select flex-1 pl-3 pr-9 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent appearance-none cursor-pointer"
                                >
                                    <option value="">MM</option>
                                    {availableMinutes.map(minute => (
                                        <option key={minute} value={minute}>{minute}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={!selectedDate || !selectedHour || !selectedMinute}
                        onClick={handleAddClick}
                        className="px-6 py-2.5 text-sm font-semibold text-white bg-[#8e78b7] hover:bg-[#7d68a6] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Add
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DatePickerModal;