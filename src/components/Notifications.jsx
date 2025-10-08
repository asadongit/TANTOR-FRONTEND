import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import {
    ChevronRight, RefreshCcw, CheckCircle, XCircle, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ApprovalModal from '../pages/datagovernance/BusinessCatalogue/ApprovalModal';

// This is a small, self-contained helper component for rendering owner notifications.
// Keeping it here makes the main component's JSX cleaner.
const OwnerNotificationItem = ({ icon, message, reason, onDismiss, isDismissing, isAnyDismissing }) => (
    <div className="px-4 py-3 hover:bg-gray-50 flex items-start justify-between">
        <div className="flex items-start flex-grow mr-2 min-w-0">
            <div className="flex-shrink-0 mt-1">{icon}</div>
            <div className="ml-3">
                <p className="text-sm text-gray-900 break-words">{message}</p>
                {reason && <span className="block text-xs text-gray-500 mt-1">Reason: {reason}</span>}
            </div>
        </div>
        {onDismiss && (
            <button
                onClick={onDismiss}
                className="p-2 -m-2 text-gray-400 hover:text-gray-700 rounded-full flex-shrink-0 flex items-center justify-center"
                aria-label="Dismiss notification"
                disabled={isAnyDismissing}
                title="Mark as viewed"
            >
                {isDismissing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                ) : (
                    <X size={16} />
                )}
            </button>
        )}
    </div>
);


const Notifications = ({ isDataSteward, isDataOwner }) => {
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    // All state related to notifications is now inside this component
    const [stewardNotifications, setStewardNotifications] = useState(null);
    const [descriptionNotifications, setDescriptionNotifications] = useState(null);
    const [tableLinkageNotifications, setTableLinkageNotifications] = useState(null);
    const [columnLinkageNotifications, setColumnLinkageNotifications] = useState(null);
    const [deletionNotifications, setDeletionNotifications] = useState(null);
    const [tableLinkageDeletionNotifications, setTableLinkageDeletionNotifications] = useState(null);
    const [columnLinkageDeletionNotifications, setColumnLinkageDeletionNotifications] = useState(null);

    const [ownerBusinessCatalogue, setOwnerBusinessCatalogue] = useState(null);
    const [ownerColumnLinkage, setOwnerColumnLinkage] = useState(null);
    const [ownerTableLinkage, setOwnerTableLinkage] = useState(null);
    const [ownerSchemaDescriptions, setOwnerSchemaDescriptions] = useState(null);
    const [ownerTableDescriptions, setOwnerTableDescriptions] = useState(null);
    const [ownerColumnDescriptions, setOwnerColumnDescriptions] = useState(null);
    const [ownerDeletions, setOwnerDeletions] = useState(null);
    const [ownerConnectionDescriptions, setOwnerConnectionDescriptions] = useState(null);
    const [ownerTableLinkageDeletions, setOwnerTableLinkageDeletions] = useState(null);
    const [ownerColumnLinkageDeletions, setOwnerColumnLinkageDeletions] = useState(null);

    const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastFetched, setLastFetched] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [dismissingId, setDismissingId] = useState(null);

    const notificationsRef = useRef(null);

    const { token, decodedToken } = useAuth();

    // --- Data Fetching and Handling Logic ---

    const fetchStewardNotifications = useCallback(async (showLoading = true) => {
        if (showLoading) {
            setIsLoadingNotifications(true);
            setIsRefreshing(true);
        }
        try {
            const response = await fetch(`${window._env_?.VITE_FAST_API}/notifications/status_approval`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            setStewardNotifications(data.business_catalogue);
            setDescriptionNotifications(data.description);
            setTableLinkageNotifications(data['table linkage']);
            setColumnLinkageNotifications(data['column linkage']);
            setDeletionNotifications(data.deletions || []);
            setTableLinkageDeletionNotifications(data['table linkage deletions'] || []);
            setColumnLinkageDeletionNotifications(data['column linkage deletions'] || []);
            setLastFetched(Date.now());
        } catch (error) {
            console.error('Error fetching steward notifications:', error);
        } finally {
            if (showLoading) {
                setIsLoadingNotifications(false);
                setIsRefreshing(false);
            }
        }
    }, [token]);

    const fetchDataOwnerNotifications = useCallback(async (showLoading = true) => {
        if (showLoading) {
            setIsLoadingNotifications(true);
            setIsRefreshing(true);
        }
        try {
            const response = await fetch(`${window._env_?.VITE_FAST_API}/notifications/data_owner`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ user: [decodedToken?.preferred_username] })
            });
            const result = await response.json();
            setOwnerBusinessCatalogue(result['business catalogue'] || []);
            setOwnerColumnLinkage(result['column linkage'] || []);
            setOwnerTableLinkage(result['table linkage'] || []);
            setOwnerSchemaDescriptions(result['schema descriptions'] || []);
            setOwnerTableDescriptions(result['table descriptions'] || []);
            setOwnerColumnDescriptions(result['column descriptions'] || []);
            setOwnerConnectionDescriptions(result['connection descriptions'] || []);
            setOwnerDeletions(result.deletions || []);
            setOwnerTableLinkageDeletions(result['table linkage deletion'] || []);
            setOwnerColumnLinkageDeletions(result['column linkage deletion'] || []);
            setLastFetched(Date.now());
        } catch (error) {
            console.error('Error fetching data owner notifications:', error);
        } finally {
            if (showLoading) {
                setIsLoadingNotifications(false);
                setIsRefreshing(false);
            }
        }
    }, [token, decodedToken]);

    const updateStateAfterDismiss = useCallback((type, index, subIndex) => {
        const filterByIndex = (prev) => prev.filter((_, i) => i !== index);

        switch (type) {
            case 'business_catalogue': setOwnerBusinessCatalogue(filterByIndex); break;
            case 'deletion': setOwnerDeletions(filterByIndex); break;
            case 'table_linkage': setOwnerTableLinkage(filterByIndex); break;
            case 'table_linkage_deletion': setOwnerTableLinkageDeletions(filterByIndex); break;
            case 'schema_description': setOwnerSchemaDescriptions(filterByIndex); break;
            case 'table_description': setOwnerTableDescriptions(filterByIndex); break;
            case 'column_description': setOwnerColumnDescriptions(filterByIndex); break;
            case 'connection_description': setOwnerConnectionDescriptions(filterByIndex); break;
            case 'column_linkage':
                setOwnerColumnLinkage(prev => {
                    const newState = JSON.parse(JSON.stringify(prev));
                    newState[index].catalogue_linkage_column.splice(subIndex, 1);
                    return newState.filter(group => group.catalogue_linkage_column.length > 0);
                });
                break;
            case 'column_linkage_deletion':
                setOwnerColumnLinkageDeletions(prev => {
                    const newState = JSON.parse(JSON.stringify(prev));
                    newState[index].catalogue_linkage_column.splice(subIndex, 1);
                    return newState.filter(group => group.catalogue_linkage_column.length > 0);
                });
                break;
            default: break;
        }
    }, []);

    const handleDismissNotification = useCallback(async (type, notification, index, subIndex = null) => {
        const uniqueId = `${type}-${index}-${subIndex}`;
        setDismissingId(uniqueId);

        let payload = {
            user: [decodedToken?.preferred_username],
            id_set: [], catalogue: [], descriptions: [], deletions: []
        };

        switch (type) {
            case 'business_catalogue':
                payload.id_set.push({ domain_id: [notification.domain_id], category_id: [], sub_category_id: [], tag_id: [], sub_tag_id: [], term_id: [] });
                break;
            case 'deletion':
                payload.deletions.push({ domain_id: [notification.domain_id] });
                break;
            case 'table_linkage':
            case 'table_linkage_deletion':
                payload.catalogue.push({ connection_name: notification.connection_name, table_schema: notification.table_schema, table_name: notification.table_name, column_name: null });
                break;
            case 'column_linkage':
            case 'column_linkage_deletion':
                const link = notification.catalogue_linkage_column[subIndex];
                payload.catalogue.push({ connection_name: notification.connection_name, table_schema: notification.table_schema, table_name: notification.table_name, column_name: link.column_name[0] });
                break;
            case 'connection_description':
                payload.descriptions.push({ connection_name: notification.connection_name, table_schema: null, table_name: null, column_name: null });
                break;
            case 'schema_description':
                payload.descriptions.push({ connection_name: notification.connection_name, table_schema: notification.table_schema, table_name: null, column_name: null });
                break;
            case 'table_description':
                payload.descriptions.push({ connection_name: notification.connection_name, table_schema: notification.table_schema, table_name: notification.table_name, column_name: null });
                break;
            case 'column_description':
                payload.descriptions.push({ connection_name: notification.connection_name, table_schema: notification.table_schema, table_name: notification.table_name, column_name: notification.column_data.column_name });
                break;
            default:
                console.error("Unknown notification type to dismiss:", type);
                setDismissingId(null);
                return;
        }

        try {
            const response = await fetch(`${window._env_?.VITE_FAST_API}/notifications/viewed`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'accept': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                updateStateAfterDismiss(type, index, subIndex);
            } else {
                console.error('Failed to mark notification as viewed:', await response.json());
            }
        } catch (error) {
            console.error('Error dismissing notification:', error);
        } finally {
            setDismissingId(null);
        }
    }, [token, decodedToken, updateStateAfterDismiss]);

    // --- useEffect Hooks ---

    // Effect to fetch initial notifications based on user role
    useEffect(() => {
        if (isDataSteward) {
            fetchStewardNotifications(true);
        } else if (isDataOwner) {
            fetchDataOwnerNotifications(true);
        }
    }, [isDataSteward, isDataOwner, fetchStewardNotifications, fetchDataOwnerNotifications]);

    // Effect to handle closing the dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setIsNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // --- UI Handlers ---

    const toggleNotifications = () => {
        const willOpen = !isNotificationsOpen;
        
        if (willOpen) {
            const now = Date.now();
            // Refresh data if panel is opened and data is stale (older than 30s) OR if never fetched
            if (!lastFetched || now - lastFetched > 30000) {
                if (isDataSteward) fetchStewardNotifications(false);
                else if (isDataOwner) fetchDataOwnerNotifications(false);
            }
        }
        
        setIsNotificationsOpen(willOpen);
    };

    const handleRefresh = async () => {
        if (isDataSteward) {
            await fetchStewardNotifications(true);
        } else if (isDataOwner) {
            await fetchDataOwnerNotifications(true);
        }
    };

    const handleViewDetails = (type, id, details) => {
        setSelectedNotification({ type, id, details });
        setIsDetailModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsDetailModalOpen(false);
        setSelectedNotification(null);
    };

    const handleActionSuccess = () => {
        handleCloseModal();
        fetchStewardNotifications(true);
    };

    // --- Computed Values for Rendering ---

    const hasStewardNotifications = (
        (stewardNotifications && Object.keys(stewardNotifications).length > 0) ||
        (descriptionNotifications && descriptionNotifications.length > 0) ||
        (tableLinkageNotifications && tableLinkageNotifications.length > 0) ||
        (columnLinkageNotifications && columnLinkageNotifications.length > 0) ||
        (deletionNotifications && deletionNotifications.length > 0) ||
        (tableLinkageDeletionNotifications && tableLinkageDeletionNotifications.length > 0) ||
        (columnLinkageDeletionNotifications && columnLinkageDeletionNotifications.length > 0)
    );

    const hasOwnerNotifications = (
        (ownerBusinessCatalogue && ownerBusinessCatalogue.length > 0) ||
        (ownerColumnLinkage && ownerColumnLinkage.length > 0) ||
        (ownerTableLinkage && ownerTableLinkage.length > 0) ||
        (ownerSchemaDescriptions && ownerSchemaDescriptions.length > 0) ||
        (ownerTableDescriptions && ownerTableDescriptions.length > 0) ||
        (ownerColumnDescriptions && ownerColumnDescriptions.length > 0) ||
        (ownerConnectionDescriptions && ownerConnectionDescriptions.length > 0) ||
        (ownerDeletions && ownerDeletions.length > 0) ||
        (ownerTableLinkageDeletions && ownerTableLinkageDeletions.length > 0) ||
        (ownerColumnLinkageDeletions && ownerColumnLinkageDeletions.length > 0)
    );

    const hasNotifications = (isDataSteward && hasStewardNotifications) || (isDataOwner && hasOwnerNotifications);

    return (
        <>
            <div className="relative" ref={notificationsRef}>
                <button className="py-2 relative" onClick={toggleNotifications} aria-label="Notifications">
                    <BellIcon className="h-6 w-6 text-gray-600" />
                    {hasNotifications && (
                        <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                    )}
                </button>

                {isNotificationsOpen && (isDataSteward || isDataOwner) && (
                    <div className="absolute right-0 mt-2 w-[32rem] bg-white rounded-lg shadow-xl border border-gray-200 z-20 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-medium text-gray-900">Notifications</h3>
                            <button onClick={handleRefresh} className="text-xs text-[#8e78b7] flex items-center" disabled={isRefreshing}>
                                <RefreshCcw className={`text-[#8e78b7] h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        {isLoadingNotifications ? (
                            <div className="p-4 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8e78b7]"></div></div>
                        ) : !hasNotifications ? (
                            <div className="px-4 py-4 text-center"><p className="text-sm text-gray-500">No new notifications.</p></div>
                        ) : (
                            <div className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
                                {/* Steward Notifications */}
                                {isDataSteward && stewardNotifications && Object.entries(stewardNotifications).map(([domainId, notificationDetails]) => {
                                    const domainName = notificationDetails.Domain?.[0]?.name;
                                    const message = `Business catalogue entry '${domainName}' requires approval.`;
                                    return (
                                        <div key={`steward-${domainId}`} className="px-4 py-3 hover:bg-gray-50 flex justify-between items-center">
                                            <p className="text-sm text-gray-900 flex-1">{message}</p>
                                            <button onClick={() => handleViewDetails('business_catalogue', domainId, notificationDetails)} className="text-[#8e78b7] ml-2 flex-shrink-0" title="View details">
                                                <ChevronRight className='text-[#8e78b7]' size={20} />
                                            </button>
                                        </div>
                                    );
                                })}
                                {isDataSteward && descriptionNotifications?.map((desc, index) => (
                                    <div key={`desc-${index}`} className="px-4 py-3 hover:bg-gray-50 flex justify-between items-center">
                                        <p className="text-sm text-gray-900 truncate flex-1" title={desc}>{desc}</p>
                                        <button onClick={() => handleViewDetails('description', index, desc)} className="text-[#8e78b7] ml-2 flex-shrink-0" title="View details">
                                            <ChevronRight className='text-[#8e78b7]' size={20} />
                                        </button>
                                    </div>
                                ))}
                                {isDataSteward && tableLinkageNotifications?.map((n, index) => {
                                    const message = `Catalogue linkage to ${n.connection}.${n.schema}.${n.tables} requires approval.`;
                                    return (
                                        <div key={`table-link-${index}`} className="px-4 py-3 hover:bg-gray-50 flex justify-between items-center">
                                            <p className="text-sm text-gray-900 flex-1">{message}</p>
                                            <button onClick={() => handleViewDetails('table_linkage', index, n)} className="text-[#8e78b7] ml-2 flex-shrink-0" title="View details">
                                                <ChevronRight className='text-[#8e78b7]' size={20} />
                                            </button>
                                        </div>
                                    );
                                })}
                                {isDataSteward && columnLinkageNotifications?.map((n, index) => {
                                    const message = `Catalogue linkage to ${n.connection}.${n.schema}.${n.table}.${n.columns} requires approval.`;
                                    return (
                                        <div key={`column-link-${index}`} className="px-4 py-3 hover:bg-gray-50 flex justify-between items-center">
                                            <p className="text-sm text-gray-900 flex-1">{message}</p>
                                            <button onClick={() => handleViewDetails('column_linkage', index, n)} className="text-[#8e78b7] ml-2 flex-shrink-0" title="View details">
                                                <ChevronRight className='text-[#8e78b7]' size={20} />
                                            </button>
                                        </div>
                                    );
                                })}
                                {isDataSteward && deletionNotifications?.map((n) => {
                                    const message = `Deletion of Catalogue Entry "${n.domain_name}" requires approval.`;
                                    return (
                                        <div key={`deletion-${n.domain_id}`} className="px-4 py-3 hover:bg-gray-50 flex justify-between items-center">
                                            <p className="text-sm text-gray-900 flex-1">{message}</p>
                                            <button onClick={() => handleViewDetails('deletion', n.domain_id, n)} className="text-[#8e78b7] ml-2 flex-shrink-0" title="View details">
                                                <ChevronRight className='text-[#8e78b7]' size={20} />
                                            </button>
                                        </div>
                                    );
                                })}

                                {isDataSteward && tableLinkageDeletionNotifications?.map((n, index) => {
                                    const message = `Catalogue linkage removal from ${n.connection}.${n.schema}.${n.tables} requires approval.`;
                                    return (
                                        <div key={`table-link-del-${index}`} className="px-4 py-3 hover:bg-gray-50 flex justify-between items-center">
                                            <p className="text-sm text-gray-900 flex-1">{message}</p>
                                            <button onClick={() => handleViewDetails('table_linkage_deletion', index, n)} className="text-[#8e78b7] ml-2 flex-shrink-0" title="View details">
                                                <ChevronRight className='text-[#8e78b7]' size={20} />
                                            </button>
                                        </div>
                                    );
                                })}
                                {isDataSteward && columnLinkageDeletionNotifications?.map((n, index) => {
                                    const message = `Catalogue linkage removal from ${n.connection}.${n.schema}.${n.table}.${n.columns} requires approval.`;
                                    return (
                                        <div key={`column-link-del-${index}`} className="px-4 py-3 hover:bg-gray-50 flex justify-between items-center">
                                            <p className="text-sm text-gray-900 flex-1">{message}</p>
                                            <button onClick={() => handleViewDetails('column_linkage_deletion', index, n)} className="text-[#8e78b7] ml-2 flex-shrink-0" title="View details">
                                                <ChevronRight className='text-[#8e78b7]' size={20} />
                                            </button>
                                        </div>
                                    );
                                })}

                                {/* Data Owner Notifications */}
                                {isDataOwner && ownerBusinessCatalogue?.map((n, i) => {
                                    const status = n.status_approval?.[0]?.toLowerCase();
                                    const icon = status === 'approved' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />;
                                    let message = `Your entry '${n.domain_name}' has been ${status}`;
                                    if (status === 'approved') message += ` with status ${n.status}`;
                                    const uniqueId = `business_catalogue-${i}-null`;
                                    return (
                                        <OwnerNotificationItem
                                            key={`owner-bc-${n.domain_id}`}
                                            icon={icon}
                                            message={message}
                                            reason={status === 'rejected' ? ((n.reason && n.reason !== 'false') ? n.reason : '-') : null}
                                            onDismiss={(e) => { e.stopPropagation(); handleDismissNotification('business_catalogue', n, i); }}
                                            isDismissing={dismissingId === uniqueId}
                                            isAnyDismissing={dismissingId !== null}
                                        />
                                    );
                                })}
                                {isDataOwner && ownerTableLinkage?.map((n, i) => {
                                    const status = n.catalogue_linkage_table?.[0]?.status_approval[0]?.toLowerCase();
                                    const icon = status === 'approved' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />;
                                    const message = `Your entry for Catalogue linkage to ${n.connection_name}.${n.table_schema}.${n.table_name} has been ${status}.`;
                                    const reasonText = n.catalogue_linkage_table?.[0]?.reason?.join(', ');
                                    const uniqueId = `table_linkage-${i}-null`;
                                    return (
                                        <OwnerNotificationItem
                                            key={`owner-tl-${i}`}
                                            icon={icon}
                                            message={message}
                                            reason={status === 'rejected' ? (reasonText || '-') : null}
                                            onDismiss={(e) => { e.stopPropagation(); handleDismissNotification('table_linkage', n, i); }}
                                            isDismissing={dismissingId === uniqueId}
                                            isAnyDismissing={dismissingId !== null}
                                        />
                                    );
                                })}
                                {isDataOwner && ownerColumnLinkage?.flatMap((n, i) =>
                                    n.catalogue_linkage_column.map((link, j) => {
                                        const status = link.status_approval[0]?.toLowerCase();
                                        const icon = status === 'approved' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />;
                                        const message = `Your entry for Catalogue linkage to ${n.connection_name}.${n.table_schema}.${n.table_name}.${link.column_name[0]} has been ${status}.`;
                                        const reasonText = link.reason?.join(', ');
                                        const uniqueId = `column_linkage-${i}-${j}`;
                                        return (
                                            <OwnerNotificationItem
                                                key={`owner-cl-${i}-${j}`}
                                                icon={icon}
                                                message={message}
                                                reason={status === 'rejected' ? (reasonText || '-') : null}
                                                onDismiss={(e) => { e.stopPropagation(); handleDismissNotification('column_linkage', n, i, j); }}
                                                isDismissing={dismissingId === uniqueId}
                                                isAnyDismissing={dismissingId !== null}
                                            />
                                        );
                                    })
                                )}
                                {isDataOwner && ownerTableLinkageDeletions?.map((n, i) => {
                                    const status = n.catalogue_linkage_table?.[0]?.status_approval[0]?.toLowerCase();
                                    const icon = status === 'approved' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />;
                                    const message = `Your entry for Catalogue linkage removal to ${n.connection_name}.${n.table_schema}.${n.table_name} has been ${status}.`;
                                    const reasonText = n.catalogue_linkage_table?.[0]?.reason?.join(', ');
                                    const uniqueId = `table_linkage_deletion-${i}-null`;
                                    return (
                                        <OwnerNotificationItem
                                            key={`owner-tld-${i}`}
                                            icon={icon}
                                            message={message}
                                            reason={status === 'rejected' ? (reasonText || '-') : null}
                                            onDismiss={(e) => { e.stopPropagation(); handleDismissNotification('table_linkage_deletion', n, i); }}
                                            isDismissing={dismissingId === uniqueId}
                                            isAnyDismissing={dismissingId !== null}
                                        />
                                    );
                                })}
                                {isDataOwner && ownerColumnLinkageDeletions?.flatMap((n, i) =>
                                    n.catalogue_linkage_column.map((link, j) => {
                                        const status = link.status_approval[0]?.toLowerCase();
                                        const icon = status === 'approved' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />;
                                        const message = `Your entry for Catalogue linkage removal to ${n.connection_name}.${n.table_schema}.${n.table_name}.${link.column_name[0]} has been ${status}.`;
                                        const reasonText = link.reason?.join(', ');
                                        const uniqueId = `column_linkage_deletion-${i}-${j}`;
                                        return (
                                            <OwnerNotificationItem
                                                key={`owner-cld-${i}-${j}`}
                                                icon={icon}
                                                message={message}
                                                reason={status === 'rejected' ? (reasonText || '-') : null}
                                                onDismiss={(e) => { e.stopPropagation(); handleDismissNotification('column_linkage_deletion', n, i, j); }}
                                                isDismissing={dismissingId === uniqueId}
                                                isAnyDismissing={dismissingId !== null}
                                            />
                                        );
                                    })
                                )}
                                {isDataOwner && ownerDeletions?.map((n, i) => {
                                    const status = n.delete_approval?.status_approval[0]?.toLowerCase();
                                    const icon = status === 'approved' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />;
                                    const message = `Deletion of Catalogue Entry "${n.domain_name}" has been ${status}.`;
                                    const reasonText = n.delete_approval?.reason[0];
                                    const uniqueId = `deletion-${i}-null`;
                                    return (
                                        <OwnerNotificationItem
                                            key={`owner-del-${n.domain_id}`}
                                            icon={icon}
                                            message={message}
                                            reason={status === 'rejected' ? (reasonText || '-') : null}
                                            onDismiss={(e) => { e.stopPropagation(); handleDismissNotification('deletion', n, i); }}
                                            isDismissing={dismissingId === uniqueId}
                                            isAnyDismissing={dismissingId !== null}
                                        />
                                    );
                                })}
                                {isDataOwner && ownerConnectionDescriptions?.map((n, i) => {
                                    const status = n.status_approval?.[0]?.toLowerCase();
                                    const icon = status === 'approved' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />;
                                    const message = `Your description "${n.pre_approval_description}" for connection "${n.connection_name}" has been ${status}.`;
                                    const uniqueId = `connection_description-${i}-null`;
                                    return (
                                        <OwnerNotificationItem
                                            key={`owner-conn-desc-${i}`}
                                            icon={icon}
                                            message={message}
                                            reason={status === 'rejected' ? (n.reason || '-') : null}
                                            onDismiss={(e) => { e.stopPropagation(); handleDismissNotification('connection_description', n, i); }}
                                            isDismissing={dismissingId === uniqueId}
                                            isAnyDismissing={dismissingId !== null}
                                        />
                                    );
                                })}
                                {isDataOwner && ownerSchemaDescriptions?.map((n, i) => {
                                    const status = n.description_data.status_approval[0]?.toLowerCase();
                                    const icon = status === 'approved' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />;
                                    const desc = n.description_data.pre_approval_description[0];
                                    const target = `${n.connection_name}.${n.table_schema}`;
                                    const message = `Your description "${desc}" for schema ${target} has been ${status}.`;
                                    const reasonText = n.description_data.reason?.join(', ');
                                    const uniqueId = `schema_description-${i}-null`;
                                    return (
                                        <OwnerNotificationItem
                                            key={`owner-sd-${i}`}
                                            icon={icon}
                                            message={message}
                                            reason={status === 'rejected' ? (reasonText || '-') : null}
                                            onDismiss={(e) => { e.stopPropagation(); handleDismissNotification('schema_description', n, i); }}
                                            isDismissing={dismissingId === uniqueId}
                                            isAnyDismissing={dismissingId !== null}
                                        />
                                    );
                                })}
                                {isDataOwner && ownerTableDescriptions?.map((n, i) => {
                                    const status = n.description_data.status_approval[0]?.toLowerCase();
                                    const icon = status === 'approved' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />;
                                    const desc = n.description_data.pre_approval_description[0];
                                    const target = `${n.connection_name}.${n.table_schema}.${n.table_name}`;
                                    const message = `Your description "${desc}" for table ${target} has been ${status}.`;
                                    const reasonText = n.description_data.reason?.join(', ');
                                    const uniqueId = `table_description-${i}-null`;
                                    return (
                                        <OwnerNotificationItem
                                            key={`owner-td-${i}`}
                                            icon={icon}
                                            message={message}
                                            reason={status === 'rejected' ? (reasonText || '-') : null}
                                            onDismiss={(e) => { e.stopPropagation(); handleDismissNotification('table_description', n, i); }}
                                            isDismissing={dismissingId === uniqueId}
                                            isAnyDismissing={dismissingId !== null}
                                        />
                                    );
                                })}
                                {isDataOwner && ownerColumnDescriptions?.map((n, i) => {
                                    const status = n.column_data.status_approval[0]?.toLowerCase();
                                    const icon = status === 'approved' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />;
                                    const desc = n.column_data.pre_approval_description[0];
                                    const target = `${n.connection_name}.${n.table_schema}.${n.table_name}.${n.column_data.column_name}`;
                                    const message = `Your description "${desc}" for column ${target} has been ${status}.`;
                                    const reasonText = n.column_data.reason?.join(', ');
                                    const uniqueId = `column_description-${i}-null`;
                                    return (
                                        <OwnerNotificationItem
                                            key={`owner-cd-${i}`}
                                            icon={icon}
                                            message={message}
                                            reason={status === 'rejected' ? (reasonText || '-') : null}
                                            onDismiss={(e) => { e.stopPropagation(); handleDismissNotification('column_description', n, i); }}
                                            isDismissing={dismissingId === uniqueId}
                                            isAnyDismissing={dismissingId !== null}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <ApprovalModal
                isOpen={isDetailModalOpen}
                onClose={handleCloseModal}
                notification={selectedNotification}
                onActionSuccess={handleActionSuccess}
            />
        </>
    );
};

export default Notifications;