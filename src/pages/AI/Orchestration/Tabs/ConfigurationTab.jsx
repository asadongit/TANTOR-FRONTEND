import { Calendar, Clock } from 'lucide-react';

const ConfigurationTab = ({
    formData,
    handleInputChange,
    scheduleType,
    handleScheduleTypeChange,
    setShowDateModal,
    generateSummary,
    summary,
    selectedMonth,
    selectedDate,
}) => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    const renderSelect = (label, value, options, field) => (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
            <select 
                value={value} 
                onChange={(e) => handleInputChange(field, e.target.value)} 
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-500 bg-white focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
            >
                {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
    );

    return (
        <div className="max-w-6xl space-y-6">
            <div>
                <h2 className="text-base font-bold text-gray-900 mb-4">Model Configuration</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {renderSelect('Project', formData.project, [
                        { value: 'Project 1', label: 'Project 1' }, 
                        { value: 'Project 2', label: 'Project 2' }, 
                        { value: 'Project 3', label: 'Project 3' }
                    ], 'project')}
                    {renderSelect('Model', formData.model, [
                        { value: '', label: 'Select' }, 
                        { value: 'model1', label: 'Model 1' }, 
                        { value: 'model2', label: 'Model 2' }
                    ], 'model')}
                    {renderSelect('Data source', formData.dataSource, [
                        { value: '', label: 'Select' }, 
                        { value: 'source1', label: 'Data Source 1' }, 
                        { value: 'source2', label: 'Data Source 2' }
                    ], 'dataSource')}
                    {renderSelect('Destination Table', formData.destinationTable, [
                        { value: '', label: 'Select' }, 
                        { value: 'table1', label: 'Table 1' }, 
                        { value: 'table2', label: 'Table 2' }
                    ], 'destinationTable')}
                </div>
            </div>

            <div>
                <h2 className="text-base font-bold text-gray-900 mb-0.5">Schedule Type</h2>
                <p className="text-xs text-gray-500 mb-3">Select how and when this model should run.</p>
                <div className="flex flex-wrap gap-3">
                    {['Single Run', 'Recurring', 'Periodic (Interval)'].map((type) => (
                        <label 
                            key={type} 
                            className={`flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer transition-colors ${
                                scheduleType === type ? 'text-[#8e78b7] bg-purple-50' : 'text-gray-700'
                            }`}
                        >
                            <input 
                                type="radio" 
                                name="scheduleType" 
                                value={type} 
                                checked={scheduleType === type}
                                onChange={(e) => handleScheduleTypeChange(e.target.value)}
                                className="w-4 h-4 text-[#8e78b7] border-gray-300 focus:ring-[#8e78b7]" 
                            />
                            <span className={`text-sm ${scheduleType === type ? 'text-[#8e78b7]' : 'text-gray-700'}`}>
                                {type}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {scheduleType === 'Recurring' && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                            {renderSelect('Frequency', formData.frequency, [
                                { value: '', label: 'Select' }, 
                                { value: 'daily', label: 'Daily' }, 
                                { value: 'weekly', label: 'Weekly' }, 
                                { value: 'monthly', label: 'Monthly' }
                            ], 'frequency')}
                            {renderSelect('Time Zone', formData.timeZone, [
                                { value: '', label: 'Select' }, 
                                { value: 'utc', label: 'UTC' }, 
                                { value: 'est', label: 'EST' }, 
                                { value: 'pst', label: 'PST' }, 
                                { value: 'ist', label: 'IST' }
                            ], 'timeZone')}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Run Days</label>
                            <p className="text-xs text-gray-500 mb-3">Choose the days the model should execute.</p>
                            <div className="flex gap-2">
                                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                                    <button 
                                        key={idx} 
                                        onClick={() => {
                                            const days = formData.runDays || [];
                                            handleInputChange('runDays', days.includes(idx) ? days.filter(d => d !== idx) : [...days, idx]);
                                        }} 
                                        className={`w-9 h-9 rounded-full text-xs font-medium transition-colors ${
                                            (formData.runDays || []).includes(idx) 
                                                ? 'bg-[#8e78b7] text-white' 
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
                {scheduleType === 'Periodic (Interval)' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                        {renderSelect('Frequency', formData.frequency, [
                            { value: '', label: 'Select' }, 
                            { value: 'hourly', label: 'Hourly' }, 
                            { value: 'every-2-hours', label: 'Every 2 hours' }, 
                            { value: 'every-4-hours', label: 'Every 4 hours' }, 
                            { value: 'every-6-hours', label: 'Every 6 hours' }
                        ], 'frequency')}
                        {renderSelect('Time Zone', formData.timeZone, [
                            { value: '', label: 'Select' }, 
                            { value: 'utc', label: 'UTC' }, 
                            { value: 'est', label: 'EST' }, 
                            { value: 'pst', label: 'PST' }, 
                            { value: 'ist', label: 'IST' }
                        ], 'timeZone')}
                    </div>
                )}
                {scheduleType === 'Single Run' && (
                    <div className="max-w-xs">
                        {renderSelect('Time Zone', formData.timeZone, [
                            { value: '', label: 'Select' }, 
                            { value: 'utc', label: 'UTC' }, 
                            { value: 'est', label: 'EST' }, 
                            { value: 'pst', label: 'PST' }, 
                            { value: 'ist', label: 'IST' }
                        ], 'timeZone')}
                    </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Start Date</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={formData.startDate} 
                                readOnly 
                                onClick={() => setShowDateModal(true)} 
                                placeholder="DD/MM/YYYY"
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7] pr-10 cursor-pointer" 
                            />
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                    {renderSelect('Run Time', formData.runTime, [
                        { value: '', label: 'Select' }, 
                        { value: '00:00', label: '00:00' }, 
                        { value: '01:00', label: '01:00' }, 
                        { value: '02:00', label: '02:00' }, 
                        { value: '06:00', label: '06:00' }, 
                        { value: '12:00', label: '12:00' }, 
                        { value: '18:00', label: '18:00' }
                    ], 'runTime')}
                </div>
            </div>

            <div className="pt-2 space-y-4">
                <button 
                    onClick={generateSummary} 
                    disabled={!formData.startDate || !formData.runTime || !formData.timeZone}
                    className={`px-5 py-2 rounded text-sm font-medium transition-colors ${
                        formData.startDate && formData.runTime && formData.timeZone 
                            ? 'bg-[#8e78b7] text-white hover:bg-[#b5a3cc] cursor-pointer' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    Generate Summary
                </button>

                {summary && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-purple-50">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#8e78b7] flex items-center justify-center flex-shrink-0">
                                <Clock className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-gray-900 mb-0.5">Summary</h3>
                                <p className="text-xs text-gray-600 mb-2">{scheduleType}</p>
                                <div className="text-sm text-gray-700 space-y-1">
                                    {summary.split('\n').map((line, idx) => line.trim() && <div key={idx}>{line}</div>)}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConfigurationTab;