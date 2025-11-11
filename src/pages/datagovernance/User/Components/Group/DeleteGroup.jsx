



import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext';

const DeleteGroup = ({ showModal, setShowModal, groupName, onConfirm }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [policyCount, setPolicyCount] = useState(null);
  const [policyCountLoading, setPolicyCountLoading] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    if (showModal && groupName) {
      setIsDeleted(false);
      setIsLoading(false);
      fetchPolicyCount();
    }
  }, [showModal, groupName]);

  const fetchPolicyCount = async () => {
    setPolicyCountLoading(true);
    try {
      const response = await fetch(
        `${window._env_?.VITE_FAST_API}/auth/policies/count/group/${encodeURIComponent(groupName)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error("Failed to fetch policy count");
        setPolicyCount(null);
        return;
      }

      const data = await response.json();
      setPolicyCount(data.policy_count);
    } catch (error) {
      console.error("Error fetching policy count:", error);
      setPolicyCount(null);
    } finally {
      setPolicyCountLoading(false);
    }
  };

  if (!showModal || !groupName) return null;

  const handleClose = () => {
    setIsDeleted(false);
    setIsLoading(false);
    setPolicyCount(null);
    setPolicyCountLoading(false);
    setShowModal(false);
  };

  const handleConfirmDelete = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      setIsDeleted(true);
    } catch (error) {
      console.error('Error deleting group:', error);
    } finally {
      setIsLoading(false);
    }
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
              {isDeleted ? 'Group Deleted' : 'Delete Confirmation'}
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
              <p className="text-lg font-medium text-gray-800">Deleting group...</p>
            </div>
          )}

          {isDeleted && (
            <div className="p-4 bg-green-50 rounded-lg text-center mb-6">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-lg font-medium text-gray-800 break-words" style={{ wordWrap: 'break-word', whiteSpace: 'normal', overflowWrap: 'break-word' }}>
  Group "{groupName}" deleted successfully
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
                <p className="text-lg font-medium text-gray-800 break-words" style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
  You are about to delete the group "{groupName}"
</p>
                
                {/* Policy Count Warning */}
                {policyCountLoading ? (
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <Loader className="h-4 w-4 text-gray-500 animate-spin" />
                    <p className="text-gray-500">Checking related policies...</p>
                  </div>
                ) : policyCount !== null && policyCount > 0 ? (
                  <p className="text-gray-500 mt-2">
                    This will also delete {policyCount} {policyCount === 1 ? "policy" : "policies"} linked to "{groupName}"
                  </p>
                ) : null}
                
                <p className="text-gray-500 mt-2">This action cannot be undone.</p>
              </div>

              <p className="text-gray-600 text-center mb-6">Do you want to continue?</p>

              <div className="flex justify-center gap-4">
                <button
                  onClick={handleConfirmDelete}
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

export default DeleteGroup;

