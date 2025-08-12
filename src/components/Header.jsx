import React, { useState, useRef, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Settings, User, HelpCircle, Shield, CreditCard, Crown, Building,
  ChevronRight, RefreshCcw, CheckCircle, XCircle, X // 1. Imported the 'X' icon
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
  const [ownerNotifications, setOwnerNotifications] = useState(null);

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
      setStewardNotifications(data);
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
      setOwnerNotifications(result.data);
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

  const handleMarkAsViewed = async (domainId) => {
    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/notifications/viewed`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({
          user: [decodedToken?.preferred_username],
          id_set: [{
            domain_id: [domainId],
            category_id: [],
            sub_category_id: [],
            tag_id: [],
            sub_tag_id: [],
            term_id: []
          }]
        })
      });

      if (response.ok) {
        setOwnerNotifications(prevNotifications =>
          prevNotifications.filter(n => n.domain_id !== domainId)
        );
      } else {
        const errorData = await response.json();
        console.error('Failed to mark notification as viewed:', errorData);
      }
    } catch (error) {
      console.error('Error in handleMarkAsViewed:', error);
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

  const handleViewDetails = (domainId, notificationDetails) => {
    setSelectedNotification({ id: domainId, details: notificationDetails });
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

  const hasNotifications = (isDataSteward && stewardNotifications && Object.keys(stewardNotifications).length > 0) ||
    (isDataOwner && ownerNotifications && ownerNotifications.length > 0);


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
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-20 overflow-hidden">
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
                  <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                    {isDataSteward && stewardNotifications && Object.entries(stewardNotifications).map(([domainId, notification]) => {
                      if (notification.Domain && notification.Domain.length > 0) {
                        return notification.Domain.map((domain, index) => (
                          <div key={`domain-${domainId}-${index}`} className="px-4 py-3 hover:bg-gray-50">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-sm text-gray-900">
                                  New business catalogue entry '{domain.name}' requires approval.
                                </p>
                              </div>
                              <button
                                onClick={() => handleViewDetails(domainId, notification)}
                                className="text-[#8e78b7] ml-2 flex-shrink-0"
                                title={`View details`}
                              >
                                <ChevronRight className='text-[#8e78b7]' size={20} />
                              </button>
                            </div>
                          </div>
                        ));
                      }
                      return null;
                    })}

                    {isDataOwner && ownerNotifications && ownerNotifications.map((notification) => (
                      <div key={notification.domain_id} className="px-4 py-3 hover:bg-gray-50 flex items-start justify-between">
                        <div className="flex items-start flex-grow mr-2">
                          <div className="flex-shrink-0 mt-1">
                            {notification.status_approval === 'Approved' ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-gray-900">
                              Your entry '{notification.domain_name}' has been {notification.status_approval?.toLowerCase()}
                              {notification.status_approval?.toLowerCase() === 'approved' && ` with status ${notification.status}`}
                              {notification.status_approval?.toLowerCase() === 'rejected' && notification.reason &&
                                <span className="block text-xs text-gray-500 mt-1">Reason: {notification.reason}</span>
                              }
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsViewed(notification.domain_id);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-700 rounded-full flex-shrink-0"
                          aria-label="Dismiss notification"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              className="w-10 h-10 bg-gradient-to-br from-[#8e78b7] to-purple-400 rounded-full flex items-center justify-center text-white hover:shadow-md transition-all duration-200 border-2 border-white"
              onClick={toggleProfile}
              aria-label="Open user menu"
            >
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