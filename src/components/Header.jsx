import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Settings, User, HelpCircle, Shield, CreditCard, Crown, Building
} from 'lucide-react';
import Logo from '../assets/TantorlogoNew.png';
import { useAuth } from '../context/AuthContext';
import { useFetchUser } from '../hooks/platform/user';
import Notifications from './Notifications';
import GovernanceSearch from '../pages/datagovernance/Components/GovernanceSearch';

const Header = ({ activeSection }) => {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const dropdownRef = useRef(null);

  const { decodedToken, logout } = useAuth();
  const userId = decodedToken?.sub;
  const { data: user, isLoading } = useFetchUser(userId);

  const isDataSteward = decodedToken?.resource_access?.darch?.roles?.some(role =>
    ['persona:data steward'].includes(role.toLowerCase())
  );

  const isDataOwner = decodedToken?.resource_access?.darch?.roles?.some(role =>
    ['persona:data owner'].includes(role.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleProfile = () => setIsProfileOpen(!isProfileOpen);

  const handleLogoutClick = () => {
    setIsProfileOpen(false);
    setIsLogoutModalOpen(true);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setTimeout(() => {
        window.location.href = `${window.location.origin}`;
      }, 3000);
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  const handleCancelLogout = () => {
    if (isLoggingOut) return;
    setIsLogoutModalOpen(false);
  };

  const formatDate = (dateString) => {
    const date = dateString ? new Date(dateString) : new Date();
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 h-16 flex items-center px-6 justify-between shadow-sm">
        <div className="flex items-center">
          <img src={Logo} alt="Tantor" className="h-10 cursor-pointer" onClick={() => navigate('/dashboard')} />
        </div>
        <div className="flex items-center gap-4">
          {activeSection == "datagovernance" ? (
            <GovernanceSearch
              activeSection={activeSection}
            />
          ) :
            (
              <div className="relative">
                <input type="text" placeholder="Search" className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8e78b7] w-64" />
              </div>
            )}

          <Notifications
            isDataSteward={isDataSteward}
            isDataOwner={isDataOwner}
          />
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
                    <div className="flex items-start space-x-3">
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

                          {
                            (user?.roles || decodedToken?.resource_access?.darch?.roles)?.map((role, index) => {
                              const cleanedRole = role.toLowerCase().startsWith('persona:')
                                ? role.substring(8).trim()
                                : role.trim();

                              return (
                                <span
                                  key={`role-${index}`}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                                >
                                  <Shield size={12} className="mr-1" />
                                  {cleanedRole}
                                </span>
                              );
                            })
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* <div className="py-1">
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
                </div> */}

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
                  <button className="flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 w-full text-left" onClick={handleLogoutClick}>
                    <LogOut size={16} className="mr-3 text-red-500" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <LogOut className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Sign Out</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      {isLoggingOut
                        ? "Signing you out, please wait..."
                        : "Are you sure you want to sign out of your account?"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm ${isLoggingOut ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                    }`}
                  onClick={handleConfirmLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing Out...
                    </>
                  ) : (
                    "Sign Out"
                  )}
                </button>
                <button
                  type="button"
                  className={`mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium sm:mt-0 sm:w-auto sm:text-sm ${isLoggingOut ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                    }`}
                  onClick={handleCancelLogout}
                  disabled={isLoggingOut}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;