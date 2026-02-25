import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext';

const DeleteUser = ({ isOpen, onClose, userData, onConfirmDelete, selectedUsers = [], onBulkDeleteSuccess }) => {
  const isBulk = selectedUsers.length >= 2;
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [deletedCount, setDeletedCount] = useState(0);  
  const [wasBluk, setWasBulk] = useState(false); 
  const { token } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setIsDeleted(false);
      setIsLoading(false);
    }
  }, [isOpen, userData]);

  if (!isOpen || (!userData && !isBulk)) return null;

  const handleClose = () => {
    setIsDeleted(false);
    setIsLoading(false);
    onClose();
  };

  const handleConfirm = async () => {
  setIsLoading(true);
    const bulkSnapshot = isBulk;           // ← snapshot
    const countSnapshot = selectedUsers.length; // ← snapshot
    try {
      const user_ids = isBulk ? selectedUsers : [userData.id];
      const response = await fetch(`${window._env_?.VITE_FAST_API}/auth/users`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_ids })
      });
      if (response.ok) {
        setWasBulk(bulkSnapshot);       // ← save snapshot to state
        setDeletedCount(countSnapshot); // ← save snapshot to state
        setIsDeleted(true);
        if (isBulk) {
          if (onBulkDeleteSuccess) onBulkDeleteSuccess(); // clears selectedUsers
        } else {
          if (onConfirmDelete) onConfirmDelete(userData.id);
        }
      }
    } catch (error) {
      console.error('Error deleting user(s):', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (user) => {
    if (selectedUsers.length >= 2) {
      setUserToDelete(null);  // ← don't set a single user
    } else {
      setUserToDelete(user);
    }
    setIsDeleteModalOpen(true);
    setActiveMenu(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-[500px] p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {isDeleted ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            )}
            <h2 className="text-xl font-bold text-red-500">
              {isDeleted ? (wasBluk ? 'Users Deleted' : 'User Deleted') : 'Delete Confirmation'}
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
              <p className="text-lg font-medium text-gray-800">
                {isBulk ? `Deleting ${selectedUsers.length} users...` : 'Deleting user...'}
              </p>
            </div>
          )}

          {isDeleted && (
            <div className="p-4 bg-green-50 rounded-lg text-center mb-6">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-lg font-medium text-gray-800">
                {wasBluk
                  ? `${deletedCount} users deleted successfully`
                  : `User "${userData?.username}" deleted successfully`}
              </p>
              <button
                onClick={handleClose}
                className="mt-6 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {!isLoading && !isDeleted && (
            <>
              <div className="p-4 bg-red-50 rounded-lg text-center mb-6">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-2" />
                <p className="text-lg font-medium text-gray-800">
                  {isBulk ? `You are about to delete ${selectedUsers.length} users` : `You are about to delete the user "${userData.username}"`}
                </p>
                <p className="text-gray-500 mt-2">This action cannot be undone.</p>
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

export default DeleteUser;