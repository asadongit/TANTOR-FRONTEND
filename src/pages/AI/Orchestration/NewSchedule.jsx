import { useState } from "react";
import DiscardModal from "./modals/DiscardModal";
import { CheckCircle, ChevronLeft, Loader2, X } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import DeliveryAlertsTab from "./Tabs/DeliveryAlertsTab";
import ConfigurationTab from "./Tabs/ConfigurationTab";
import RecipientsTab from "./Tabs/RecipientsTab";
import { useAIPlayground } from '../../../context/AIPlaygroundContext';
import { useAuth } from "../../../context/AuthContext";

const NewSchedule = () => {
    const navigate = useNavigate();
    const hostnameAI = window._env_?.VITE_AI_API;
    const { schedulerState, setSchedulerState } = useAIPlayground();
    const { token, decodedToken } = useAuth();
    const [activeTab, setActiveTab] = useState('Configuration');
    const [showDiscardModal, setShowDiscardModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
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

    const handleAlertInputChange = (field, value) => setAlertFormData(prev => ({ ...prev, [field]: value }));

    const hasUnsavedChanges = () =>
        schedulerState.project ||
        schedulerState.model ||
        schedulerState.source.source_table ||
        schedulerState.target.destination_table ||
        schedulerState.scheduler.timeZone ||
        schedulerState.scheduler.startDateTime ||
        schedulerState.scheduler.frequency;

    const handleBackClick = () =>
        hasUnsavedChanges() ? setShowDiscardModal(true) : navigate('/ai/orchestration');

    const handleNextFromDeliveryAlerts = () => {
        setActiveTab('Recipients');
    };

    const handleBackFromDeliveryAlerts = () => {
        setActiveTab('Configuration');
    };

    const handleRecipientsChange = (recipientNames) => {
        setSchedulerState(prev => ({
            ...prev,
            recipients: recipientNames
        }));
    };

    const handleSaveAndContinue = () => {
        const isConfigurationComplete =
            schedulerState.workflow_name &&
            schedulerState.project &&
            schedulerState.model &&
            schedulerState.source.source_table &&
            schedulerState.target.destination_table &&
            schedulerState.scheduler.timeZone &&
            schedulerState.scheduler.intervalValue;

        if (isConfigurationComplete) {
            setActiveTab('Delivery & Alerts');
        }
    };

    const handleBackFromRecipients = () => {
        setActiveTab('Delivery & Alerts');
    };

    const handleCreateSchedule = async () => {
        setIsCreating(true);

        try {
            const dagConfig = {
                dag_config: {
                    owner_id: schedulerState?.owner_id,
                    created_by: decodedToken?.preferred_username,
                    workflow_name: schedulerState.workflow_name,
                    project: schedulerState.project,
                    model: schedulerState.model,
                    model_id: schedulerState.model_id,
                    project_id: schedulerState.project_id,
                    flow_type: schedulerState.flow_type || "",
                    scheduler: {
                        mode: schedulerState.scheduler.mode || "auto",
                        frequency: schedulerState.scheduler.frequency || "",
                        runningDays: schedulerState.scheduler.runningDays || [],
                        endDateTime: schedulerState.scheduler.endDateTime || "",
                        intervalType: schedulerState.scheduler.intervalType || "",
                        intervalValue: schedulerState.scheduler.intervalValue,
                        startDateTime: new Date().toISOString().slice(0, 16),
                        timeZone: schedulerState.scheduler.timeZone
                    },
                    source: {
                        source_conn_type: schedulerState.source.source_conn_type || "postgres",
                        source_schema: schedulerState.source.source_schema,
                        source_table: schedulerState.source.source_table
                    },
                    target: {
                        destination_conn_type: schedulerState.target.destination_conn_type || "postgres",
                        destination_schema: schedulerState.target.destination_schema,
                        destination_table: schedulerState.target.destination_table
                    },
                    data_drift_threshold: schedulerState.data_drift_threshold,
                    model_drift_threshold: schedulerState.model_drift_threshold,
                    data_drift_check: schedulerState.data_drift_check,
                    model_drift_check: schedulerState.model_drift_check,
                    recipients: schedulerState.recipients || [],
                    airflow_dag_id: ""
                }
            };

            const triggerResponse = await fetch(
                `${hostnameAI}/orchestration/trigger-dag`,
                {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(dagConfig)
                }
            );

            if (!triggerResponse.ok) {
                const errorData = await triggerResponse.json();
                throw new Error(errorData.detail || 'Failed to create schedule');
            }

            const result = await triggerResponse.json();
            console.log('Schedule created successfully:', result);

            setShowSuccessModal(true);

        } catch (error) {
            console.error('Error creating schedule:', error);
            alert(`Failed to create schedule: ${error.message}`);
        } finally {
            setIsCreating(false);
        }
    };

    const handleSuccessModalClose = () => {
        setShowSuccessModal(false);
        navigate('/ai/orchestration');
    };

    const isConfigurationComplete =
        schedulerState.workflow_name &&
        schedulerState.project &&
        schedulerState.model &&
        schedulerState.source.source_table &&
        schedulerState.target.destination_table &&
        schedulerState.scheduler.timeZone &&
        schedulerState.scheduler.intervalValue;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleBackClick}
                        className="text-gray-600 hover:text-gray-900"
                        disabled={isCreating}
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
                            className={`py-3 px-1 text-sm font-normal relative whitespace-nowrap ${activeTab === tab
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
                    {activeTab === 'Configuration' && <ConfigurationTab />}

                    {activeTab === 'Delivery & Alerts' && (
                        <DeliveryAlertsTab
                            alertFormData={alertFormData}
                            handleAlertInputChange={handleAlertInputChange}
                        />
                    )}

                    {activeTab === 'Recipients' &&
                        <RecipientsTab
                            onRecipientsChange={handleRecipientsChange}
                        />}
                </div>
            </div>

            <div className="bg-white border-t border-gray-200 px-4 py-3 mt-auto">
                <div className="flex justify-end gap-3">
                    {activeTab === 'Configuration' && (
                        <button
                            onClick={handleSaveAndContinue}
                            disabled={!isConfigurationComplete}
                            className={`px-6 py-2 rounded text-sm font-medium transition-colors ${isConfigurationComplete && !isCreating
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
                                disabled={isCreating}
                                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleNextFromDeliveryAlerts}
                                className="px-6 py-2 bg-[#8e78b7] text-white rounded text-sm font-medium hover:bg-[#7a6aa0] transition-colors disabled:opacity-50"
                            >
                                Next
                            </button>
                        </>
                    )}

                    {activeTab === 'Recipients' && (
                        <>
                            <button
                                onClick={handleBackFromRecipients}
                                disabled={isCreating}
                                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleCreateSchedule}
                                disabled={isCreating}
                                className={`px-6 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 ${isCreating
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-[#8e78b7] text-white hover:bg-[#7a6aa0] cursor-pointer'
                                    }`}
                            >
                                {isCreating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Creating Schedule...
                                    </>
                                ) : (
                                    'Create Schedule'
                                )}
                            </button>
                        </>
                    )}
                </div>
                {showSuccessModal &&
                    (
                        <div className="fixed inset-0 z-50 flex items-center justify-center">
                            {/* Backdrop */}
                            <div
                                className="absolute inset-0 bg-black bg-opacity-50"
                                onClick={handleSuccessModalClose}
                            />

                            {/* Modal */}
                            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                                {/* Close button */}
                                <button
                                    onClick={handleSuccessModalClose}
                                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                <div className="flex flex-col items-center text-center">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                        <CheckCircle className="w-10 h-10 text-green-600" />
                                    </div>

                                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                                        Schedule Created Successfully!
                                    </h2>

                                    <p className="text-gray-600 mb-6">
                                        Your schedule has been created and will run according to the configured settings.
                                    </p>

                                    <button
                                        onClick={handleSuccessModalClose}
                                        className="px-6 py-2.5 bg-[#8e78b7] text-white rounded text-sm font-medium hover:bg-[#7a6aa0] transition-colors"
                                    >
                                        OK
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
            </div>

            <DiscardModal
                isOpen={showDiscardModal}
                onDiscard={() => navigate('/ai/orchestration')}
                onStay={() => setShowDiscardModal(false)}
            />

        </div>
    );
};

export default NewSchedule;