import { useState, useEffect, useRef } from "react";
import DiscardModal from "./modals/DiscardModal";
import { CheckCircle, ChevronLeft, Loader2, X, Check } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import DeliveryAlertsTab from "./Tabs/DeliveryAlertsTab";
import ConfigurationTab from "./Tabs/ConfigurationTab";
import RecipientsTab from "./Tabs/RecipientsTab";
import { useAIPlayground } from '../../../context/AIPlaygroundContext';
import { useAuth } from "../../../context/AuthContext";
import TuneIcons from '../../../assets/ai/tune.svg';
import NotificationIcon from '../../../assets/ai/notifications_active.svg';
import GroupIcon from '../../../assets/ai/group_add.svg';

function SvgIcon({ src, size = 18, className = '', style = {} }) {
    return (
        <img
            src={src}
            alt=""
            className={className}
            style={{
                width: size, height: size,
                minWidth: size, minHeight: size,
                maxWidth: size, maxHeight: size,
                display: 'block', objectFit: 'contain',
                ...style,
            }}
        />
    );
}

const ACTIVE_ICON_FILTER =
    'invert(51%) sepia(29%) saturate(672%) hue-rotate(221deg) brightness(88%) contrast(87%)';

const TABS = [
    { id: 'Configuration', label: 'Configurations', icon: TuneIcons },
    { id: 'Delivery & Alerts', label: 'Delivery & Alerts', icon: NotificationIcon },
    { id: 'Recipients', label: 'Recipients', icon: GroupIcon },
];

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

    const validateConfigRef = useRef(null);

    useEffect(() => {
        const fetchUserId = async () => {
            if (!decodedToken?.preferred_username) return;
            try {
                const response = await fetch(
                    `${hostnameAI}/users/users/get-id?username=${decodedToken.preferred_username}`,
                    { method: 'GET', headers: { 'accept': 'application/json' } }
                );
                if (!response.ok) throw new Error('Failed to fetch user ID');
                const data = await response.json();
                setSchedulerState(prev => ({ ...prev, owner_id: data.user_id }));
            } catch (error) {
                console.error('Error fetching user ID:', error);
            }
        };
        fetchUserId();
    }, [decodedToken?.preferred_username, setSchedulerState]);

    const handleAlertInputChange = (field, value) =>
        setAlertFormData(prev => ({ ...prev, [field]: value }));

    const hasUnsavedChanges = () =>
        schedulerState.project || schedulerState.model || schedulerState.source.source_table ||
        schedulerState.target.destination_table || schedulerState.scheduler.timeZone ||
        schedulerState.scheduler.startDateTime || schedulerState.scheduler.frequency;

    const handleBackClick = () =>
        hasUnsavedChanges() ? setShowDiscardModal(true) : navigate('/ai/orchestration');

    const handleNextFromDeliveryAlerts = () => setActiveTab('Recipients');
    const handleBackFromDeliveryAlerts = () => setActiveTab('Configuration');
    const handleBackFromRecipients = () => setActiveTab('Delivery & Alerts');

    const handleRecipientsChange = (recipientNames) => {
        setSchedulerState(prev => ({ ...prev, recipients: recipientNames }));
    };

    const handleSaveAndContinue = () => {
        if (validateConfigRef.current) {
            const errors = validateConfigRef.current();
            if (Object.keys(errors).length === 0) {
                setActiveTab('Delivery & Alerts');
            }
        }
    };

    const getISTDateTime = () => {
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istTime = new Date(now.getTime() + istOffset);
        const year = istTime.getUTCFullYear();
        const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
        const day = String(istTime.getUTCDate()).padStart(2, '0');
        const hours = String(istTime.getUTCHours()).padStart(2, '0');
        const minutes = String(istTime.getUTCMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const handleCreateSchedule = async () => {
        setIsCreating(true);
        try {
            const secureQueryResponse = await fetch(
                `${window._env_?.VITE_FAST_API}/secure-query`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ user_query: "" }),
                }
            );
            if (!secureQueryResponse.ok) throw new Error("Failed to fetch policy IDs");
            const secureQueryData = await secureQueryResponse.json();
            const policyIds = secureQueryData.matched_policy_ids;

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
                        startDateTime: getISTDateTime(),
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
                    mode: schedulerState.mode || 'read',
                    policy_id: policyIds
                }
            };

            const triggerResponse = await fetch(`${hostnameAI}/orchestration/trigger-dag`, {
                method: 'POST',
                headers: { 'accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify(dagConfig)
            });
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

    const handleConfirmDiscard = () => {
        setSchedulerState({
            owner_id: '', project: '', model: '', model_id: '', project_id: '',
            flow_type: 'single_run',
            scheduler: { mode: 'auto', frequency: '', runningDays: [], endDateTime: '', intervalType: 'single_run', intervalValue: '', startDateTime: '' },
            source: { source_conn_type: '', source_schema: '', source_table: '' },
            target: { destination_conn_type: '', destination_schema: '', destination_table: '' },
            data_drift_threshold: { distribution_drift_threshold: 0, statistical_significance_level: 0, information_stability_threshold: 0, target_stability_threshold: 0 },
            model_drift_threshold: { prediction_drift_threshold: 0, performance_drift_threshold: -1 },
            data_drift_check: 0, model_drift_check: 0, recipients: [], created_by: '', workflow_name: ''
        });
        navigate('/ai/orchestration');
    };

    const activeTabIndex = TABS.findIndex(t => t.id === activeTab);

    return (
        <div className="h-full flex flex-col overflow-hidden bg-gray-50 p-4 gap-2">

            {/* ── Header ── */}
            <div className="flex-shrink-0 bg-white rounded-md px-6 py-3">
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleBackClick}
                        className="text-[#818181] hover:text-gray-700 mt-0.5"
                        disabled={isCreating}
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1
                        className="text-xl font-medium text-[#332849] leading-none tracking-normal"
                        style={{ fontFamily: 'Satoshi, sans-serif' }}
                    >
                        New Schedule
                    </h1>
                </div>
            </div>

            <div className="flex-shrink-0 bg-white rounded-md px-6 pt-3 pb-4 relative overflow-hidden">
                <div className="flex items-center justify-between">
                    {TABS.map((tab, index) => {
                        const isActive = tab.id === activeTab;
                        const isPast = index < activeTabIndex;

                        return (
                            <div key={tab.id} className="flex items-center" style={{ flex: index < TABS.length - 1 ? '1' : undefined }}>
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-9 h-9 rounded-md flex items-center justify-center transition-all ${isActive
                                                ? 'bg-[#F2EBFF] border border-[#8E77BB]'
                                                : isPast
                                                    ? 'bg-[#D4FFEF]'
                                                    : 'bg-[#F9F9F9]'
                                            }`}
                                    >
                                        {isPast ? (
                                            <div className="bg-[#2ba995] rounded-full p-1">
                                                <Check size={12} className="text-white stroke-[4]" />
                                            </div>
                                        ) : (
                                            <SvgIcon
                                                src={tab.icon}
                                                size={16}
                                                style={isActive ? { filter: ACTIVE_ICON_FILTER } : { filter: 'opacity(0.45)' }}
                                            />
                                        )}
                                    </div>

                                    <span
                                        className={`text-sm font-medium whitespace-nowrap ${isActive ? 'text-[#8e78b7]'
                                                : isPast ? 'text-[#36AD8F]'
                                                    : 'text-[#818181]'
                                            }`}
                                    >
                                        {tab.label}
                                    </span>
                                </div>

                                {index < TABS.length - 1 && (
                                    <div className="flex-1 flex items-center justify-center px-4">
                                        <div className="w-full border-t border-dashed border-[#818181] relative flex items-center justify-end">
                                            <div className="absolute right-0 w-1.5 h-1.5 border-t border-r border-dashed border-[#818181] rotate-45 -mr-0.5" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div
                    className="absolute bottom-0 left-0 right-0 h-[5px]"
                    style={{
                        background: 'linear-gradient(90deg, #8E77BB 0%, #F2EBFF 100%)'
                    }}
                />
            </div>

            <div className="flex flex-col flex-1 overflow-hidden min-h-0">

                <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="bg-white rounded-t-lg shadow-sm p-5">
                        {activeTab === 'Configuration' && (
                            <ConfigurationTab
                                onValidationErrors={(fn) => { validateConfigRef.current = fn(); }}
                            />
                        )}
                        {activeTab === 'Delivery & Alerts' && (
                            <DeliveryAlertsTab
                                alertFormData={alertFormData}
                                handleAlertInputChange={handleAlertInputChange}
                            />
                        )}
                        {activeTab === 'Recipients' && (
                            <RecipientsTab
                                onRecipientsChange={handleRecipientsChange}
                                initialRecipients={schedulerState?.recipients || []}
                            />
                        )}
                    </div>
                </div>

                <div
                    className="flex-shrink-0 bg-white border-t border-gray-200 px-8 py-2"
                    style={{ boxShadow: '0px -4px 9px 0px #0000001A' }}
                >
                    <div className="flex justify-end gap-3">
                        {activeTab === 'Configuration' && (
                            <button
                                onClick={handleSaveAndContinue}
                                className="px-6 py-2 rounded-md text-sm font-medium transition-colors bg-[#8e78b7] text-white hover:bg-[#7a6aa0] cursor-pointer"
                            >
                                Save &amp; Continue
                            </button>
                        )}
                        {activeTab === 'Delivery & Alerts' && (
                            <>
                                <button
                                    onClick={handleBackFromDeliveryAlerts}
                                    disabled={isCreating}
                                    className="px-8 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleNextFromDeliveryAlerts}
                                    className="px-8 py-2 bg-[#8e78b7] text-white rounded-md text-sm font-medium hover:bg-[#7a6aa0] transition-colors"
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
                                    className="px-8 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleCreateSchedule}
                                    disabled={isCreating}
                                    className={`px-6 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${isCreating
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-[#8e78b7] text-white hover:bg-[#7a6aa0] cursor-pointer'
                                        }`}
                                >
                                    {isCreating
                                        ? (<><Loader2 className="w-4 h-4 animate-spin" />Creating Schedule...</>)
                                        : 'Create Schedule'
                                    }
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Success Modal ── */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleSuccessModalClose} />
                    <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
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

            <DiscardModal
                isOpen={showDiscardModal}
                onDiscard={handleConfirmDiscard}
                onStay={() => setShowDiscardModal(false)}
            />
        </div>
    );
};

export default NewSchedule;