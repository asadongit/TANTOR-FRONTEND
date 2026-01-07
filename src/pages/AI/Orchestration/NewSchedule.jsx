import { useState } from "react";
import DiscardModal from "./modals/DiscardModal";
import DatePickerModal from "./modals/DatePickerModal";
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import DeliveryAlertsTab from "./Tabs/DeliveryAlertsTab";
import ConfigurationTab from "./Tabs/ConfigurationTab";
import RecipientsTab from "./Tabs/RecipientsTab";

const NewSchedule = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Configuration');
    const [scheduleType, setScheduleType] = useState('Single Run');
    const [showDateModal, setShowDateModal] = useState(false);
    const [showDiscardModal, setShowDiscardModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [summary, setSummary] = useState(null);
    const [formData, setFormData] = useState({
        project: 'Project 1', 
        model: '', 
        dataSource: '', 
        destinationTable: '',
        timeZone: '', 
        startDate: '', 
        runTime: '', 
        frequency: '', 
        runDays: []
    });
    const [alertFormData, setAlertFormData] = useState({
        warningThreshold: 0.15, 
        blockingThreshold: 0.24, 
        f1ScoreDecay: 10,
        emailEnabled: false, 
        slackEnabled: false, 
        webhookEnabled: false,
        alertSubjectTemplate: '', 
        reportFormat: ''
    });

    const tabs = ['Configuration', 'Delivery & Alerts', 'Recipients'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    const handleInputChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
    const handleAlertInputChange = (field, value) => setAlertFormData(prev => ({ ...prev, [field]: value }));

    const handleScheduleTypeChange = (newType) => {
        setScheduleType(newType);
        setFormData(prev => ({ 
            ...prev, 
            frequency: '', 
            runDays: [], 
            timeZone: '', 
            startDate: '', 
            runTime: '' 
        }));
        setSummary(null);
        setSelectedDate(null);
    };

    const hasUnsavedChanges = () => 
        formData.model || 
        formData.dataSource || 
        formData.destinationTable ||
        formData.timeZone || 
        formData.startDate || 
        formData.runTime || 
        summary;

    const handleBackClick = () => 
        hasUnsavedChanges() ? setShowDiscardModal(true) : navigate('/ai/orchestration');

    const handleDateModalAdd = () => {
        if (selectedDate && formData.runTime) {
            const today = new Date();
            const isToday = selectedDate === today.getDate() && 
                           selectedMonth === today.getMonth() && 
                           selectedYear === today.getFullYear();

            if (isToday) {
                const [hours, minutes] = formData.runTime.split(':');
                const selectedTime = parseInt(hours) * 60 + parseInt(minutes);
                const currentTime = today.getHours() * 60 + today.getMinutes();

                if (selectedTime <= currentTime) {
                    alert('Please select a time in the future for today\'s date');
                    return;
                }
            }

            handleInputChange('startDate', 
                `${String(selectedDate).padStart(2, '0')}/${String(selectedMonth + 1).padStart(2, '0')}/${selectedYear}`
            );
            setShowDateModal(false);
        }
    };

    const generateSummary = () => {
        if (!formData.startDate || !formData.runTime || !formData.timeZone) return;

        const formattedDate = `${monthNames[selectedMonth]} ${selectedDate}`;
        const time = `${formData.runTime} (${formData.timeZone.toUpperCase()})`;

        const summaries = {
            'Single Run': `• Scheduled to run once on ${formattedDate} at ${time}.\n• One-time execution scheduled for ${formattedDate}, ${time}.`,
            'Recurring': `• Scheduled to run ${formData.frequency || 'selected frequency'} starting ${formattedDate} at ${time}.\n• Recurring execution on ${formData.frequency || 'selected frequency'} basis.`,
            'Periodic (Interval)': `• Scheduled to run ${formData.frequency || 'selected interval'} starting ${formattedDate} at ${time}.\n• Periodic execution at ${formData.frequency || 'selected interval'} intervals.`
        };

        setSummary(summaries[scheduleType]);
    };

    const handleNextFromDeliveryAlerts = () => {
        setActiveTab('Recipients');
    };

    const handleBackFromDeliveryAlerts = () => {
        setActiveTab('Configuration');
    };

    const handleSaveAndContinue = () => {
        if (summary) {
            setActiveTab('Delivery & Alerts');
        }
    };

    const handleBackFromRecipients = () => {
        setActiveTab('Delivery & Alerts');
    };

    const handleCreateSchedule = () => {
        console.log('Creating schedule with data:', {
            formData,
            alertFormData,
            scheduleType,
            summary
        });
        navigate('/ai/orchestration');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleBackClick} 
                        className="text-gray-600 hover:text-gray-900"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-lg sm:text-xl font-semibold text-gray-900">New Schedule</h1>
                </div>
            </div>

            <div className="bg-white border-b border-gray-200 px-4 sm:px-6">
                <div className="flex gap-6">
                    {tabs.map((tab) => (
                        <button 
                            key={tab} 
                            className={`py-3 px-1 text-sm font-normal relative whitespace-nowrap ${
                                activeTab === tab 
                                    ? 'text-[#8e78b7]' 
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8e78b7]"></div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 pt-4">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    {activeTab === 'Configuration' && (
                        <ConfigurationTab
                            formData={formData}
                            handleInputChange={handleInputChange}
                            scheduleType={scheduleType}
                            handleScheduleTypeChange={handleScheduleTypeChange}
                            setShowDateModal={setShowDateModal}
                            generateSummary={generateSummary}
                            summary={summary}
                            selectedMonth={selectedMonth}
                            selectedDate={selectedDate}
                        />
                    )}

                    {activeTab === 'Delivery & Alerts' && (
                        <DeliveryAlertsTab
                            alertFormData={alertFormData}
                            handleAlertInputChange={handleAlertInputChange}
                        />
                    )}

                    {activeTab === 'Recipients' && <RecipientsTab />}
                </div>
            </div>

            <div className="bg-white border-t border-gray-200 px-4 py-3 mt-auto">
                <div className="flex justify-end gap-3">
                    {activeTab === 'Configuration' && (
                        <button 
                            onClick={handleSaveAndContinue} 
                            disabled={!summary}
                            className={`px-6 py-2 rounded text-sm font-medium transition-colors ${
                                summary 
                                    ? 'bg-[#8e78b7] text-white hover:bg-[#b5a3cc] cursor-pointer' 
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            Save & Continue
                        </button>
                    )}
                    
                    {activeTab === 'Delivery & Alerts' && (
                        <>
                            <button 
                                onClick={handleBackFromDeliveryAlerts}
                                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
                            >
                                Back
                            </button>
                            <button 
                                onClick={handleNextFromDeliveryAlerts}
                                className="px-6 py-2 bg-[#8e78b7] text-white rounded text-sm font-medium hover:bg-[#7a6aa0] transition-colors"
                            >
                                Next
                            </button>
                        </>
                    )}

                    {activeTab === 'Recipients' && (
                        <>
                            <button 
                                onClick={handleBackFromRecipients}
                                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
                            >
                                Back
                            </button>
                            <button 
                                onClick={handleCreateSchedule}
                                className="px-6 py-2 bg-[#8e78b7] text-white rounded text-sm font-medium hover:bg-[#7a6aa0] transition-colors"
                            >
                                Create Schedule
                            </button>
                        </>
                    )}
                </div>
            </div>

            <DiscardModal 
                isOpen={showDiscardModal} 
                onDiscard={() => navigate('/ai/orchestration')} 
                onStay={() => setShowDiscardModal(false)} 
            />
            <DatePickerModal 
                isOpen={showDateModal} 
                onClose={() => setShowDateModal(false)} 
                selectedDate={selectedDate} 
                setSelectedDate={setSelectedDate}
                selectedMonth={selectedMonth} 
                setSelectedMonth={setSelectedMonth} 
                selectedYear={selectedYear} 
                setSelectedYear={setSelectedYear}
                formData={formData} 
                handleInputChange={handleInputChange} 
                onAdd={handleDateModalAdd} 
            />
        </div>
    );
};

export default NewSchedule;