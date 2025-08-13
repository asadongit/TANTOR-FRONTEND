import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';


const ApprovalModal = ({ isOpen, onClose, notification, onActionSuccess }) => {
    const { token, decodedToken } = useAuth();
    const [activeTab, setActiveTab] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [isRejecting, setIsRejecting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const notificationData = notification?.details;

    const availableTabs = useMemo(() => {
        if (!notificationData) return [];
        const tabOrder = ['Domain', 'Category', 'Sub-Category', 'Term', 'Tag', 'Sub-Tag'];
        return tabOrder.filter(tab => notificationData[tab] && notificationData[tab].length > 0);
    }, [notificationData]);

    useEffect(() => {
        if (isOpen && availableTabs.length > 0) {
            setActiveTab(availableTabs[0]);
            setError(null);
            setIsRejecting(false);
            setRejectionReason('');
        }
    }, [isOpen, availableTabs]);

    if (!isOpen || !notificationData) return null;

    const constructPayload = (status, reason = null) => {
        const idMap = {
            'Domain': 'domain_id',
            'Category': 'category_id',
            'Sub-Category': 'sub_category_id',
            'Term': 'term_id',
            'Tag': 'tag_id',
            'Sub-Tag': 'sub_tag_id'
        };

        const approvalData = {
            status_approval: status,
        };

        if (reason) {
            approvalData.reason = reason;
        }

        Object.keys(notificationData).forEach(key => {
            const payloadKey = idMap[key];
            const items = notificationData[key];
            if (payloadKey && Array.isArray(items) && items.length > 0) {
                approvalData[payloadKey] = items.map(item => item.id).filter(id => id != null);
            }
        });

        return { approval: [approvalData] };
    };
    const handleAction = async (status, reason = null) => {
        setIsProcessing(true);
        setError(null);

        const payload = constructPayload(status, reason);

        try {
            const response = await fetch(`${window._env_?.VITE_FAST_API}/notifications/approved`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `API Error: ${response.statusText}`);
            }
            onActionSuccess();
            const data = await response.json()
            console.log("response is @@ ", data)
            toast.success(data.message);
            onClose();

        } catch (err) {
            console.error(`Error during ${status} action:`, err);
            setError(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleApprove = () => handleAction('Approved');

    const handleConfirmReject = () => {
        if (!rejectionReason.trim()) {
            setError('A reason is required for rejection.');
            return;
        }
        handleAction('Rejected', rejectionReason);
    };

    const renderDetailItem = (item, type) => (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-500">Name</label>
                    <p className="mt-1 text-md text-gray-800">{item.name || 'N/A'}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-500">Current Status</label>
                    <p className="mt-1 text-md text-gray-800">{item.status || 'N/A'}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-500">Description</label>
                    <p className="mt-1 text-md text-gray-800">{item.description || 'N/A'}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-500">Owner(s)</label>
                    <p className="mt-1 text-md text-gray-800">{item.owner?.join(', ') || 'N/A'}</p>
                </div>
            </div>
            <div className="grid grid-cols-1">
                {type === 'Domain' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-500">Stakeholder(s)</label>
                        <p className="mt-1 text-md text-gray-800">{item.stakeholder?.join(', ') || 'N/A'}</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderContent = () => {
        const items = notificationData[activeTab];
        if (!items || items.length === 0) {
            return <div className="py-16 text-center text-gray-500">No details for this section.</div>;
        }

        return (
            <div className="space-y-6 py-6">
                {items.map((item, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-gray-50/50">
                        {renderDetailItem(item, activeTab)}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60" onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col transform transition-all">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Approval Request Details</h3>
                    <button title="Close" onClick={onClose} className="text-gray-400 hover:text-gray-600"><XCircle className="h-6 w-6" /></button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                            {availableTabs.map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium focus:outline-none ${activeTab === tab
                                        ? 'border-[#8e78b7] text-[#8e78b7]'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`
                                    }
                                >
                                    {tab.replace('-', ' ')}
                                </button>
                            ))}
                        </nav>
                    </div>
                    {renderContent()}

                    {isRejecting && (
                        <div className="mt-4 p-4 border-t border-gray-200">
                            <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700">
                                Reason for Rejection <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-1">
                                <textarea
                                    rows={3}
                                    name="rejectionReason"
                                    id="rejectionReason"
                                    className="px-3 py-2 shadow-sm focus:ring-[#8e78b7] focus:border-[#8e78b7] block w-full sm:text-sm border-gray-300 rounded-md"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Provide a clear reason for rejecting this request..."
                                    disabled={isProcessing}
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-3 bg-red-100 text-red-700 border border-red-200 rounded-md text-sm flex items-center gap-2">
                            <AlertTriangle size={18} />
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 rounded-b-lg">
                    {isRejecting ? (
                        <>
                            <button type="button" onClick={() => setIsRejecting(false)} disabled={isProcessing} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                                Cancel
                            </button>
                            <button type="button" onClick={handleConfirmReject} disabled={isProcessing || !rejectionReason.trim()} className="inline-flex items-center px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                <XCircle size={16} className="mr-2" />
                                {isProcessing ? 'Processing...' : 'Confirm Rejection'}
                            </button>
                        </>
                    ) : (
                        <>
                            <button type="button" onClick={onClose} disabled={isProcessing} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                                Cancel
                            </button>
                            <button type="button" onClick={() => setIsRejecting(true)} disabled={isProcessing} className="inline-flex items-center px-4 py-2 bg-red-100 border border-transparent rounded-md text-sm font-medium text-red-700 hover:bg-red-200 disabled:opacity-50">
                                <XCircle size={16} className="mr-2" />
                                Reject
                            </button>
                            <button type="button" onClick={handleApprove} disabled={isProcessing} className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
                                <CheckCircle size={16} className="mr-2" />
                                {isProcessing ? 'Processing...' : 'Approve'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ApprovalModal;
