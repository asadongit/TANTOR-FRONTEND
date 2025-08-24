import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';

const ApprovalModal = ({ isOpen, onClose, notification, onActionSuccess }) => {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [isRejecting, setIsRejecting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [activeNestedTabIndex, setActiveNestedTabIndex] = useState(0);

    const [linkageDetails, setLinkageDetails] = useState(null);
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);

    const { type, details } = notification || {};
    const businessCatalogueData = type === 'business_catalogue' ? details : null;
    const descriptionData = type === 'description' ? details : null;
    const linkageData = (type === 'table_linkage' || type === 'column_linkage') ? details : null;

    const availableTabs = useMemo(() => {
        if (!businessCatalogueData) return [];
        const tabOrder = ['Domain', 'Category', 'Sub-Category', 'Term', 'Tag', 'Sub-Tag'];
        return tabOrder.filter(tab => businessCatalogueData[tab] && businessCatalogueData[tab].length > 0);
    }, [businessCatalogueData]);

    useEffect(() => {
        if (isOpen) {
            setError(null);
            setIsRejecting(false);
            setRejectionReason('');
            setLinkageDetails(null);
            if (type === 'business_catalogue' && availableTabs.length > 0) {
                setActiveTab(availableTabs[0]);
            }
        }
    }, [isOpen, type, availableTabs]);

    useEffect(() => {
        if (isOpen && linkageData) {
            const fetchLinkageDetails = async () => {
                setIsFetchingDetails(true);
                setError(null);

                const payload = {
                    domain_id: linkageData.domain_id?.flat() || [],
                    category_id: linkageData.category_id?.flat() || [],
                    sub_category_id: linkageData.sub_category_id?.flat() || [],
                    term_id: linkageData.term_id?.flat() || [],
                    tag_id: linkageData.tag_id?.flat() || [],
                    sub_tag_id: linkageData.sub_tag_id?.flat() || [],
                };

                try {
                    const response = await fetch(`${window._env_?.VITE_FAST_API}/business_catalogue/data_prefill`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify(payload),
                    });
                    if (!response.ok) {
                        throw new Error('Failed to fetch linkage details from the server.');
                    }
                    const data = await response.json();
                    setLinkageDetails(data);
                } catch (err) {
                    setError(err.message);
                    setLinkageDetails(null);
                } finally {
                    setIsFetchingDetails(false);
                }
            };
            fetchLinkageDetails();
        }
    }, [isOpen, linkageData, token]);

    useEffect(() => {
        setActiveNestedTabIndex(0);
    }, [activeTab]);

    if (!isOpen || !details) return null;

    const constructFinalPayload = (status, reason = null) => {
        let payload = {};
        const statusInPayload = status.toLowerCase();

        switch (type) {
            case 'business_catalogue': {
                const idMap = {
                    'Domain': 'domain_id', 'Category': 'category_id', 'Sub-Category': 'sub_category_id',
                    'Term': 'term_id', 'Tag': 'tag_id', 'Sub-Tag': 'sub_tag_id'
                };
                const approvalData = {
                    status_approval: statusInPayload,
                    reason: reason || ""
                };

                Object.keys(businessCatalogueData).forEach(key => {
                    const payloadKey = idMap[key];
                    const items = businessCatalogueData[key];
                    if (payloadKey && Array.isArray(items) && items.length > 0) {
                        approvalData[payloadKey] = items.map(item => item.id).filter(id => id != null);
                    }
                });
                payload.business_catalogue = [approvalData];
                break;
            }

            case 'description': {
                const descData = {
                    desc: descriptionData,
                    status_approval: statusInPayload,
                    reason: reason || ""
                };
                payload.descriptions = [descData];
                break;
            }

            case 'table_linkage':
            case 'column_linkage': {
                const dataCatObject = {
                    connection: linkageData.connection,
                    schema: linkageData.schema,
                    table: linkageData.table,
                    status_approval: statusInPayload,
                    domain_id: linkageData.domain_id?.flat() || [],
                    category_id: linkageData.category_id?.flat() || [],
                    sub_category_id: linkageData.sub_category_id?.flat() || [],
                    term_id: linkageData.term_id?.flat() || [],
                    tag_id: linkageData.tag_id?.flat() || [],
                    sub_tag_id: linkageData.sub_tag_id?.flat() || [],
                    reason: reason || ""
                };

                if (type === 'column_linkage') {
                    dataCatObject.column = linkageData.columns;
                }

                payload.data_catalogue = [dataCatObject];
                break;
            }
            case 'deletion': {
                payload.delete_business_catalogue = [{
                    status_approval: statusInPayload,
                    reason: reason || "",
                    domain_id: [details.domain_id]
                }];
                break;
            }

            default:
                throw new Error("Invalid notification type for approval action.");
        }

        return payload;
    };

    const handleAction = async (status, reason = null) => {
        setIsProcessing(true);
        setError(null);
        try {
            const payload = constructFinalPayload(status, reason);
            const response = await fetch(`${window._env_?.VITE_FAST_API}/notifications/approved`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `API Error: ${response.statusText}` }));
                throw new Error(errorData?.message || `Failed to perform ${status} action.`);
            }

            const data = await response.json();
            toast.success(data.message || `Request has been ${status.toLowerCase()}.`);
            onActionSuccess();
            onClose();
        } catch (err) {
            console.error(`Error during ${status} action:`, err);
            setError(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleApprove = () => {
        handleAction('Approved');
    };

    const handleConfirmReject = () => {
        if (!rejectionReason.trim()) {
            setError('A reason is required for rejection.');
            return;
        }
        handleAction('Rejected', rejectionReason);
    };

    const renderDetailItem = (item, itemType) => (
        <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className="block text-sm font-medium text-gray-500 mb-1">Name</label><p className="text-md font-medium text-gray-900">{item.name || 'N/A'}</p></div>
                <div><label className="block text-sm font-medium text-gray-500 mb-1">Status</label><div className="text-md text-gray-800 whitespace-pre-line">{item.status || 'N/A'}</div></div>
            </div>
            {itemType === 'Sub-Category' && (<div><label className="block text-sm font-medium text-gray-500 mb-1">Parent Category</label><p className="text-md font-medium text-gray-900">{item.category_name || '-'}</p></div>)}
            {itemType === 'Sub-Tag' && (<div><label className="block text-sm font-medium text-gray-500 mb-1">Parent Tag</label><p className="text-md font-medium text-gray-900">{item.tag_name || '-'}</p></div>)}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className="block text-sm font-medium text-gray-500 mb-1">Description</label><p className="text-md text-gray-800 whitespace-pre-line">{item.description || 'N/A'}</p></div>
                <div><label className="block text-sm font-medium text-gray-500 mb-1">Owner</label><div className="flex flex-wrap gap-1 mt-1">{item.owner?.map((owner, idx) => (<span key={idx} className="text-md text-gray-800 whitespace-pre-line">{owner}</span>)) || 'N/A'}</div></div>
            </div>
            {itemType === 'Domain' && item.stakeholder && (<div><label className="block text-sm font-medium text-gray-500 mb-1">Stakeholder(s)</label><div className="flex flex-wrap gap-1 mt-1">{item.stakeholder.map((stakeholder, idx) => (<span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{stakeholder}</span>))}</div></div>)}
        </div>
    );

    const renderBusinessCatalogueContent = () => {
        const items = businessCatalogueData[activeTab];
        if (!items || items.length === 0) return <div className="py-12 text-center text-gray-500"><AlertTriangle className="mx-auto h-10 w-10 text-gray-400" /><p className="mt-2">No details for this section.</p></div>;
        if (items.length === 1) return <div className="py-4">{renderDetailItem(items[0], activeTab)}</div>;
        return (
            <div className="pt-4">
                <nav className="flex space-x-2 pb-3 border-b border-gray-200 overflow-x-auto">
                    {items.map((item, index) => (<button key={index} onClick={() => setActiveNestedTabIndex(index)} className={`whitespace-nowrap py-2 px-4 rounded-t-md font-medium text-sm transition-colors ${activeNestedTabIndex === index ? 'bg-[#8e78b7] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{item.name}</button>))}
                </nav>
                <div className="mt-4">{items[activeNestedTabIndex] && renderDetailItem(items[activeNestedTabIndex], activeTab)}</div>
            </div>
        );
    };

    const renderNameList = (title, items) => {
        if (!items || items.length === 0) return null;
        return (
            <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase mb-2">{title} LINKED</h4>
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-md border">
                    {items.map(item => (<span key={item.name} className="px-3 py-1 bg-white border text-gray-800 rounded-full text-sm shadow-sm">{item.name}</span>))}
                </div>
            </div>
        );
    };

    const renderLinkageContent = () => {
        if (isFetchingDetails) {
            return <div className="py-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8e78b7]"></div></div>;
        }
        if (!linkageDetails) {
            return <div className="py-12 text-center text-gray-500"><AlertTriangle className="mx-auto h-10 w-10 text-gray-400" /><p className="mt-2">No details available.</p></div>;
        }
        const title = type === 'table_linkage' ?
            `Table: ${linkageData.connection}.${linkageData.schema}.${linkageData.tables}` :
            `Column: ${linkageData.connection}.${linkageData.schema}.${linkageData.table}.${linkageData.columns}`;

        return (
            <div className="py-4 space-y-5">
                <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">APPROVAL FOR</h4>
                    <p className="text-md font-semibold text-gray-900 break-all">{title}</p>
                </div>
                {renderNameList('Domain', linkageDetails.domain)}
                {renderNameList('Category', linkageDetails.category)}
                {renderNameList('Sub-Category', linkageDetails.sub_category)}
                {renderNameList('Term', linkageDetails.term)}
                {renderNameList('Tag', linkageDetails.tag)}
                {renderNameList('Sub-Tag', linkageDetails.sub_tag)}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 p-4" onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col transform transition-all overflow-hidden">
                <div className="flex justify-between items-center px-6 py-4 border-b">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900">Approval Request Details</h3>
                        <p className="text-sm text-gray-600 mt-1">Review the changes before approving or rejecting</p>
                    </div>
                    <button title="Close" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"><X className="h-6 w-6" /></button>
                </div>

                <div className="px-6 py-4 overflow-y-auto flex-grow">
                    {type === 'business_catalogue' && (<>
                        <div className="mb-2"><h4 className="text-sm font-medium text-gray-500 mb-2">CATEGORIES</h4><div className="flex flex-wrap gap-2">{availableTabs.map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-full font-medium text-sm transition-colors ${activeTab === tab ? 'bg-[#8e78b7] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{`${tab.replace('-', ' ')} (${businessCatalogueData[tab]?.length || 0})`}</button>))}</div></div>
                        <div className="bg-white rounded-lg p-1">{renderBusinessCatalogueContent()}</div>
                    </>)}
                    {type === 'description' && (<div className="py-4"><h4 className="text-sm font-medium text-gray-500 mb-2">DESCRIPTION APPROVAL</h4><div className="p-4 bg-gray-50 rounded-lg border"><p className="text-md text-gray-800">{descriptionData}</p></div></div>)}
                    {(type === 'table_linkage' || type === 'column_linkage') && renderLinkageContent()}

                    {type === 'deletion' && (
                        <div className="py-4">
                            <h4 className="text-sm font-medium text-gray-500 mb-2">DELETION APPROVAL</h4>
                            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 flex items-start gap-3">
                                <AlertTriangle className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="text-md text-yellow-900">
                                        You are requested to approve the deletion of the Business Catalogue entry:
                                        <strong className="block mt-2 text-lg">"{details.domain_name}"</strong>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {isRejecting && (<div className="mt-2 p-5 bg-orange-50 border border-orange-200 rounded-lg"><label htmlFor="rejectionReason" className="block text-sm font-medium text-orange-800 mb-2"><AlertTriangle size={18} className="inline mr-1" /> Reason for Rejection <span className="text-red-500">*</span></label><div className="mt-1"><textarea rows={3} name="rejectionReason" id="rejectionReason" className="px-3 py-2 shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border border-orange-300 rounded-md bg-white" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Provide a clear reason for rejecting this request..." disabled={isProcessing} /></div></div>)}
                    {error && !isFetchingDetails && (<div className="mt-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm flex items-start gap-3"><AlertTriangle size={20} className="flex-shrink-0 mt-0.5" /><span>{error}</span></div>)}
                </div>

                <div className="px-6 py-5 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-3">
                    {isRejecting ? (<>
                        <button type="button" onClick={() => setIsRejecting(false)} disabled={isProcessing} className="px-5 py-2.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors order-2 sm:order-1">Cancel</button>
                        <button type="button" onClick={handleConfirmReject} disabled={isProcessing || !rejectionReason.trim()} className="inline-flex items-center justify-center px-5 py-2.5 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors order-1 sm:order-2 mb-3 sm:mb-0"><XCircle size={18} className="mr-2" />{isProcessing ? 'Processing...' : 'Confirm Rejection'}</button>
                    </>) : (<>
                        <button type="button" onClick={onClose} disabled={isProcessing} className="px-5 py-2.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors order-3">Cancel</button>
                        <button type="button" onClick={() => setIsRejecting(true)} disabled={isProcessing} className="inline-flex items-center justify-center px-5 py-2.5 bg-white border border-red-300 rounded-md text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors order-2"><XCircle size={18} className="mr-2" /> Reject</button>
                        <button type="button" onClick={handleApprove} disabled={isProcessing} className="inline-flex items-center justify-center px-5 py-2.5 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors order-1 mb-3 sm:mb-0"><CheckCircle size={18} className="mr-2" />{isProcessing ? 'Processing...' : 'Approve'}</button>
                    </>)}
                </div>
            </div>
        </div>
    );
};

export default ApprovalModal;