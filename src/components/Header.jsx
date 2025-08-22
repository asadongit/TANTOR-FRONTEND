import React, { useState, useRef, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Settings, User, HelpCircle, Shield, CreditCard, Crown, Building,
  ChevronRight, RefreshCcw, CheckCircle, XCircle, X
} from 'lucide-react';
import Logo from '../assets/Tantor.svg';
import { useAuth } from '../context/AuthContext';
import { useFetchUser } from '../hooks/platform/user';
import ApprovalModal from '../pages/datagovernance/BusinessCatalogue/ApprovalModal';

const Header = () => {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const [stewardNotifications, setStewardNotifications] = useState(null);
  const [descriptionNotifications, setDescriptionNotifications] = useState(null);
  const [tableLinkageNotifications, setTableLinkageNotifications] = useState(null);
  const [columnLinkageNotifications, setColumnLinkageNotifications] = useState(null);

  const [ownerBusinessCatalogue, setOwnerBusinessCatalogue] = useState(null);
  const [ownerColumnLinkage, setOwnerColumnLinkage] = useState(null);
  const [ownerTableLinkage, setOwnerTableLinkage] = useState(null);
  const [ownerSchemaDescriptions, setOwnerSchemaDescriptions] = useState(null);
  const [ownerTableDescriptions, setOwnerTableDescriptions] = useState(null);
  const [ownerColumnDescriptions, setOwnerColumnDescriptions] = useState(null);

  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);

  const { token, decodedToken, logout } = useAuth();
  const userId = decodedToken?.sub;
  const { data: user, isLoading } = useFetchUser(userId);

  const isDataSteward = decodedToken?.resource_access?.darch?.roles?.some(role =>
    ['data steward'].includes(role.toLowerCase())
  );

  const isDataOwner = decodedToken?.resource_access?.darch?.roles?.some(role =>
    ['data owner'].includes(role.toLowerCase())
  );

  useEffect(() => {
    if (isDataSteward) {
      fetchStewardNotifications(false);
    } else if (isDataOwner) {
      fetchDataOwnerNotifications(false);
    }
  }, [isDataSteward, isDataOwner]);

  const fetchStewardNotifications = async (showLoading = true) => {
    if (showLoading) {
      setIsLoadingNotifications(true);
      setIsRefreshing(true);
    }
    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/notifications/status_approval`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setStewardNotifications(data.business_catalogue);
      setDescriptionNotifications(data.description);
      setTableLinkageNotifications(data['table linkage']);
      setColumnLinkageNotifications(data['column linkage']);
      setLastFetched(Date.now());
    } catch (error) {
      console.error('Error fetching steward notifications:', error);
    } finally {
      if (showLoading) {
        setIsLoadingNotifications(false);
        setIsRefreshing(false);
      }
    }
  };

  const fetchDataOwnerNotifications = async (showLoading = true) => {
    if (showLoading) {
      setIsLoadingNotifications(true);
      setIsRefreshing(true);
    }
    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/notifications/data_owner`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user: [decodedToken?.preferred_username] })
      });
      const result = await response.json();
      setOwnerBusinessCatalogue(result['business catalogue'] || []);
      setOwnerColumnLinkage(result['column linkage'] || []);
      setOwnerTableLinkage(result['table linkage'] || []);
      setOwnerSchemaDescriptions(result['schema descriptions'] || []);
      setOwnerTableDescriptions(result['table descriptions'] || []);
      setOwnerColumnDescriptions(result['column descriptions'] || []);
      setLastFetched(Date.now());
    } catch (error) {
      console.error('Error fetching data owner notifications:', error);
    } finally {
      if (showLoading) {
        setIsLoadingNotifications(false);
        setIsRefreshing(false);
      }
    }
  };

  const handleDismissNotification = async (type, notification, index, subIndex = null) => {
    let payload = {
      user: [decodedToken?.preferred_username],
      id_set: [],
      catalogue: [],
      descriptions: []
    };

    switch (type) {
      case 'business_catalogue':
        payload.id_set.push({ domain_id: [notification.domain_id], category_id: [], sub_category_id: [], tag_id: [], sub_tag_id: [], term_id: [] });
        break;
      case 'table_linkage':
        payload.catalogue.push({ connection_name: notification.connection_name, table_schema: notification.table_schema, table_name: notification.table_name, column_name: null });
        break;
      case 'column_linkage':
        const link = notification.catalogue_linkage_column[subIndex];
        payload.catalogue.push({ connection_name: notification.connection_name, table_schema: notification.table_schema, table_name: notification.table_name, column_name: link.column_name[0] });
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
        const errorData = await response.json();
        console.error('Failed to mark notification as viewed:', errorData);
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const updateStateAfterDismiss = (type, index, subIndex) => {
    const filterByIndex = (prev) => prev.filter((_, i) => i !== index);

    switch (type) {
      case 'business_catalogue': setOwnerBusinessCatalogue(filterByIndex); break;
      case 'table_linkage': setOwnerTableLinkage(filterByIndex); break;
      case 'schema_description': setOwnerSchemaDescriptions(filterByIndex); break;
      case 'table_description': setOwnerTableDescriptions(filterByIndex); break;
      case 'column_description': setOwnerColumnDescriptions(filterByIndex); break;
      case 'column_linkage':
        setOwnerColumnLinkage(prev => {
          const newState = JSON.parse(JSON.stringify(prev));
          const notificationGroup = newState[index];
          notificationGroup.catalogue_linkage_column.splice(subIndex, 1);
          return newState.filter(group => group.catalogue_linkage_column.length > 0);
        });
        break;
      default: break;
    }
  };

  const toggleNotifications = () => {
    const now = Date.now();
    if ((isDataSteward || isDataOwner) && (!lastFetched || now - lastFetched > 30000)) {
      if (isDataSteward) fetchStewardNotifications(false);
      else if (isDataOwner) fetchDataOwnerNotifications(false);
    }
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (isDataSteward) {
      await fetchStewardNotifications(true);
    } else if (isDataOwner) {
      await fetchDataOwnerNotifications(true);
    }
  };

  const formatDate = (dateString) => {
    const date = dateString ? new Date(dateString) : new Date();
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsProfileOpen(false);
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) setIsNotificationsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleProfile = () => setIsProfileOpen(!isProfileOpen);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getUserInitials = () => {
    if (isLoading) return 'T';
    const name = user?.name || decodedToken?.preferred_username;
    if (!name) return 'T';
    const nameParts = name.split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  const getPlanIcon = (plan) => {
    switch (plan?.toLowerCase()) {
      case 'pro': return <Crown size={12} className="mr-1" />;
      case 'enterprise': return <Building size={12} className="mr-1" />;
      default: return <User size={12} className="mr-1" />;
    }
  };

  const getPlanBadgeStyle = (plan) => {
    switch (plan?.toLowerCase()) {
      case 'pro': return 'bg-amber-100 text-amber-800';
      case 'enterprise': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const userPlan = user?.plan || 'Pro';

  const handleViewDetails = (type, id, details) => {
    setSelectedNotification({ type, id, details });
    setIsDetailModalOpen(true);
    setIsNotificationsOpen(false);
  };

  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
    setSelectedNotification(null);
  };

  const handleActionSuccess = () => {
    handleCloseModal();
    fetchStewardNotifications(true);
  };

  const hasStewardNotifications = (
    (stewardNotifications && Object.keys(stewardNotifications).length > 0) ||
    (descriptionNotifications && descriptionNotifications.length > 0) ||
    (tableLinkageNotifications && tableLinkageNotifications.length > 0) ||
    (columnLinkageNotifications && columnLinkageNotifications.length > 0)
  );

  const hasOwnerNotifications = (
    (ownerBusinessCatalogue && ownerBusinessCatalogue.length > 0) ||
    (ownerColumnLinkage && ownerColumnLinkage.length > 0) ||
    (ownerTableLinkage && ownerTableLinkage.length > 0) ||
    (ownerSchemaDescriptions && ownerSchemaDescriptions.length > 0) ||
    (ownerTableDescriptions && ownerTableDescriptions.length > 0) ||
    (ownerColumnDescriptions && ownerColumnDescriptions.length > 0)
  );

  const hasNotifications = (isDataSteward && hasStewardNotifications) || (isDataOwner && hasOwnerNotifications);

  const OwnerNotificationItem = ({ icon, message, reason, onDismiss }) => (
    <div className="px-4 py-3 hover:bg-gray-50 flex items-start justify-between">
      <div className="flex items-start flex-grow mr-2">
        <div className="flex-shrink-0 mt-1">{icon}</div>
        <div className="ml-3">
          <p className="text-sm text-gray-900">{message}</p>
          {reason && <span className="block text-xs text-gray-500 mt-1">Reason: {reason}</span>}
        </div>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="p-1 text-gray-400 hover:text-gray-700 rounded-full flex-shrink-0" aria-label="Dismiss notification">
          <X size={16} />
        </button>
      )}
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 h-16 flex items-center px-6 justify-between shadow-sm">
        <div className="flex items-center">
          <img src={Logo} alt="Tantor" className="h-8 cursor-pointer" onClick={() => navigate('/dashboard')} />
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input type="text" placeholder="Search" className="pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" />
          </div>

          <div className="relative" ref={notificationsRef}>
            <button className="p-2 hover:bg-gray-100 rounded-full relative" onClick={toggleNotifications} aria-label="Notifications">
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
                    {isDataSteward && stewardNotifications && Object.entries(stewardNotifications).map(([domainId, notificationDetails]) => {
                      const domainName = notificationDetails.Domain?.[0]?.name;
                      const message = `New business catalogue entry '${domainName}' requires approval.`;
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


                    {isDataOwner && ownerBusinessCatalogue?.map((n, i) => {
                      const status = n.status_approval?.toLowerCase();
                      const icon = status === 'approved' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />;
                      let message = `Your entry '${n.domain_name}' has been ${status}`;
                      if (status === 'approved') message += ` with status ${n.status}`;
                      return (
                        <OwnerNotificationItem
                          key={`owner-bc-${n.domain_id}`}
                          icon={icon}
                          message={message}
                          reason={status === 'rejected' ? ((n.reason && n.reason !== 'false') ? n.reason : '-') : null}
                          onDismiss={(e) => { e.stopPropagation(); handleDismissNotification('business_catalogue', n, i); }}
                        />
                      );
                    })}
                    {isDataOwner && ownerTableLinkage?.map((n, i) => {
                      const status = n.catalogue_linkage_table.status_approval[0]?.toLowerCase();
                      const icon = status === 'approved' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />;
                      const message = `Your entry for Catalogue linkage to ${n.connection_name}.${n.table_schema}.${n.table_name} has been ${status}.`;
                      const reasonText = n.catalogue_linkage_table.reason?.join(', ');
                      return (
                        <OwnerNotificationItem
                          key={`owner-tl-${i}`}
                          icon={icon}
                          message={message}
                          reason={status === 'rejected' ? (reasonText || '-') : null}
                          onDismiss={(e) => { e.stopPropagation(); handleDismissNotification('table_linkage', n, i); }}
                        />
                      );
                    })}
                    {isDataOwner && ownerColumnLinkage?.flatMap((n, i) =>
                      n.catalogue_linkage_column.map((link, j) => {
                        const status = link.status_approval[0]?.toLowerCase();
                        const icon = status === 'approved' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />;
                        const message = `Your entry for Catalogue linkage to ${n.connection_name}.${n.table_schema}.${n.table_name}.${link.column_name[0]} has been ${status}.`;
                        const reasonText = link.reason?.join(', ');
                        return (
                          <OwnerNotificationItem
                            key={`owner-cl-${i}-${j}`}
                            icon={icon}
                            message={message}
                            reason={status === 'rejected' ? (reasonText || '-') : null}
                            onDismiss={(e) => { e.stopPropagation(); handleDismissNotification('column_linkage', n, i, j); }}
                          />
                        );
                      })
                    )}
                    {isDataOwner && ownerSchemaDescriptions?.map((n, i) => {
                      const status = n.description_data.status_approval[0]?.toLowerCase();
                      const icon = status === 'approved' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />;
                      const desc = n.description_data.pre_approval_description[0];
                      const target = `${n.connection_name}.${n.table_schema}`;
                      const message = `Entry for schema description: "${desc}" has been ${status} for ${target}.`;
                      return (
                        <OwnerNotificationItem 
                          key={`owner-sd-${i}`} 
                          icon={icon} 
                          message={message} 
                          onDismiss={(e) => { e.stopPropagation(); handleDismissNotification('schema_description', n, i); }}
                        />
                      );
                    })}
                    {isDataOwner && ownerTableDescriptions?.map((n, i) => {
                      const status = n.description_data.status_approval[0]?.toLowerCase();
                      const icon = status === 'approved' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />;
                      const desc = n.description_data.pre_approval_description[0];
                      const target = `${n.connection_name}.${n.table_schema}.${n.table_name}`;
                      const message = `Entry for table description: "${desc}" has been ${status} for ${target}.`;
                      return (
                         <OwnerNotificationItem 
                           key={`owner-td-${i}`} 
                           icon={icon} 
                           message={message} 
                           onDismiss={(e) => { e.stopPropagation(); handleDismissNotification('table_description', n, i); }}
                         />
                      );
                    })}
                    {isDataOwner && ownerColumnDescriptions?.map((n, i) => {
                      const status = n.column_data.status_approval[0]?.toLowerCase();
                      const icon = status === 'approved' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />;
                      const desc = n.column_data.pre_approval_description[0];
                      const target = `${n.connection_name}.${n.table_schema}.${n.table_name}.${n.column_data.column_name}`;
                      const message = `Entry for column description: "${desc}" has been ${status} for ${target}.`;
                      return (
                        <OwnerNotificationItem 
                          key={`owner-cd-${i}`} 
                          icon={icon} 
                          message={message} 
                          onDismiss={(e) => { e.stopPropagation(); handleDismissNotification('column_description', n, i); }}
                        />
                      );
                    })}

                  </div>
                )}
              </div>
            )}
          </div>

          <div className="relative" ref={dropdownRef}>
            <button className="w-10 h-10 bg-gradient-to-br from-[#8e78b7] to-purple-400 rounded-full flex items-center justify-center text-white hover:shadow-md transition-all duration-200 border-2 border-white" onClick={toggleProfile} aria-label="Open user menu">
              {isLoading ? '...' : getUserInitials()}
            </button>
             {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-20 overflow-hidden">
                {isLoading ? (
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-14 h-14 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 mb-2 animate-pulse"></div>
                        <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-r from-[purple-50] to-indigo-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-14 h-14 bg-gradient-to-br from-[#8e78b7] to-purple-400 rounded-full flex items-center justify-center text-white text-lg font-semibold shadow-md">
                        {getUserInitials()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-medium text-gray-900 truncate">{user?.name || decodedToken?.preferred_username} </p>
                        <p className="text-sm text-gray-500 truncate">{user?.email || decodedToken?.email}</p>

                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlanBadgeStyle(userPlan)}`}>
                            {getPlanIcon(userPlan)}
                            {userPlan}
                          </span>

                          {user?.roles || decodedToken?.resource_access?.darch?.roles ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              <Shield size={12} className="mr-1" />
                              {user?.roles || decodedToken?.resource_access?.darch?.roles}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="py-1">
                  <button className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 w-full text-left" onClick={() => navigate('/dashboard')}>
                    <User size={16} className="mr-3 text-gray-500" /> My Profile
                  </button>
                  <button className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 w-full text-left" onClick={() => navigate('/dashboard')}>
                    <Settings size={16} className="mr-3 text-gray-500" /> Account Settings
                  </button>
                  <button className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 w-full text-left" onClick={() => navigate('/dashboard')}>
                    <CreditCard size={16} className="mr-3 text-gray-500" /> Billing & Plan
                  </button>
                  <button className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 w-full text-left" onClick={() => navigate('/dashboard')}>
                    <HelpCircle size={16} className="mr-3 text-gray-500" /> Help & Support
                  </button>
                </div>

                <div className="py-1 border-t border-gray-100 bg-gray-50">
                  {isLoading ? (
                    <div className="px-4 py-2">
                      <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                    </div>
                  ) : (
                    <div className="px-4 py-2 text-xs text-gray-500">
                      Member since {formatDate(user?.createdAt)}
                    </div>
                  )}
                  <button className="flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 w-full text-left" onClick={handleLogout}>
                    <LogOut size={16} className="mr-3 text-red-500" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <ApprovalModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseModal}
        notification={selectedNotification}
        onActionSuccess={handleActionSuccess}
      />
    </>
  );
};

export default Header;