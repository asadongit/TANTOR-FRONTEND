import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext';

const ToggleUserStatus = ({ isOpen, onClose, userData, onConfirmToggle, selectedUsers = [], onBulkToggleSuccess, bulkAction }) => {
  const isBulk = selectedUsers.length >= 2;
  const isDisabling = isBulk ? (bulkAction === 'disable') : userData?.enabled;
  const [isLoading, setIsLoading] = useState(false);
  const [isToggled, setIsToggled] = useState(false);
  const { token, decodedToken } = useAuth();
  const action = isDisabling ? 'disable' : 'enable';
  const actionPastTense = isDisabling ? 'disabled' : 'enabled';
  const updated_by = decodedToken?.preferred_username;   

  useEffect(() => {
    if (isOpen) {
      setIsToggled(false);
      setIsLoading(false);
    }
  }, [isOpen, userData]);

  if (!isOpen || (!userData && !isBulk)) return null;

  const handleClose = () => {
    setIsToggled(false);
    setIsLoading(false);
    onClose();
  };
  
  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const endpoint = isDisabling ? 'userdisable' : 'userenable';
      const user_ids = isBulk ? selectedUsers : [userData.id];

      const response = await fetch(`${window._env_?.VITE_FAST_API}/auth/${endpoint}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_ids, updated_by })
      });

      if (response.ok) {
        setIsToggled(true);
        if (isBulk) {
          if (onBulkToggleSuccess) onBulkToggleSuccess(!isDisabling);
        } else {
          if (onConfirmToggle) onConfirmToggle(userData.id, !isDisabling);
        }
      }
    } catch (error) {
      console.error(`Error toggling user(s):`, error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-[500px] p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {isToggled ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            )}
            <h2 className={`text-xl font-bold ${isToggled ? 'text-green-500' : 'text-red-500'}`}>
              {isToggled ? `User ${actionPastTense.charAt(0).toUpperCase() + actionPastTense.slice(1)}` : `${action.charAt(0).toUpperCase() + action.slice(1)} User`}
            </h2>
          </div>
          {!isLoading && (
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="mb-8">
          {isLoading && (
            <div className="p-4 bg-gray-50 rounded-lg text-center mb-6 flex flex-col items-center">
              <Loader className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />
              <p className="text-lg font-medium text-gray-800">{action.charAt(0).toUpperCase() + action.slice(1)}ing user...</p>
            </div>
          )}

          {isToggled && (
            <div className="p-4 bg-green-50 rounded-lg text-center mb-6">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-lg font-medium text-gray-800">
                {isBulk
                  ? `${selectedUsers.length} users ${actionPastTense} successfully`
                  : `User "${userData?.username}" ${actionPastTense} successfully`}
              </p>
              <button
                onClick={handleClose}
                className="mt-6 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {!isLoading && !isToggled && (
            <>
              <div className="p-4 bg-red-50 rounded-lg text-center mb-6">
                  <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-2" />
                <p className="text-lg font-medium text-gray-800">
                  {isBulk
                    ? `You are about to ${action} ${selectedUsers.length} users`
                    : `You are about to ${action} the user "${userData?.username}"`}
                </p>
                <p className="text-gray-500 mt-2">
                  {isDisabling 
                    ? 'User(s) will no longer be able to access the application.' 
                    : 'User(s) will be able to access the application again.'}
                </p>
              </div>
              <p className="text-gray-600 text-center mb-6">Do you want to continue?</p>

              <div className="flex justify-center gap-4">
                <button
                  onClick={handleConfirm}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Yes
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  No
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToggleUserStatus;