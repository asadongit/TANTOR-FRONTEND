import React, { useState, useRef, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings, User, HelpCircle, Shield, CreditCard, Crown, Building } from 'lucide-react';
import Logo from '../assets/Tantor.svg';
import { useAuth } from '../context/AuthContext';
import { useFetchUser } from '../hooks/platform/user';

const Header = () => {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { decodedToken, logout } = useAuth();
  const userId = decodedToken?.sub; 
  const { data: user, isLoading } = useFetchUser(userId);

  const formatDate = (dateString) => {
    const date = dateString ? new Date(dateString) : new Date();
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

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
    switch(plan?.toLowerCase()) {
      case 'pro':
        return <Crown size={12} className="mr-1" />;
      case 'enterprise':
        return <Building size={12} className="mr-1" />;
      case 'community':
      default:
        return <User size={12} className="mr-1" />;
    }
  };

  const getPlanBadgeStyle = (plan) => {
    switch(plan?.toLowerCase()) {
      case 'pro':
        return 'bg-amber-100 text-amber-800';
      case 'enterprise':
        return 'bg-blue-100 text-blue-800';
      case 'community':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const userPlan = user?.plan || 'Pro';

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 h-16 flex items-center px-6 justify-between shadow-sm">
      <div className="flex items-center">
        <img
          src={Logo}
          alt="Tantor"
          className="h-8 cursor-pointer"
          onClick={() => navigate('/dashboard')}
        />
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            className="pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-full relative">
          <BellIcon className="h-6 w-6 text-gray-600" />
          <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        </button>
        
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
                <button 
                  className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                  onClick={() => navigate('/dashboard')}
                >
                  <User size={16} className="mr-3 text-gray-500" />
                  My Profile
                </button>
                <button 
                  className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                  onClick={() => navigate('/dashboard')}
                >
                  <Settings size={16} className="mr-3 text-gray-500" />
                  Account Settings
                </button>
                <button 
                  className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                  onClick={() => navigate('/dashboard')}
                >
                  <CreditCard size={16} className="mr-3 text-gray-500" />
                  Billing & Plan
                </button>
                <button 
                  className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                  onClick={() => navigate('/dashboard')}
                >
                  <HelpCircle size={16} className="mr-3 text-gray-500" />
                  Help & Support
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
                <button 
                  className="flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                  onClick={handleLogout}
                >
                  <LogOut size={16} className="mr-3 text-red-500" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;