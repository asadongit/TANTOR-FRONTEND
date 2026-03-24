
import React, { useState, useEffect } from "react";
import { X, AlertTriangle, CheckCircle, Loader } from "lucide-react";
import { useAuth } from "../../../../../context/AuthContext";
import { toast } from "react-toastify";

const DeleteRole = ({ showModal, setShowModal, roleName, selectedRoles = [], onConfirm }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [policyCount, setPolicyCount] = useState(null);
  const [policyCountLoading, setPolicyCountLoading] = useState(false);
  const { token, decodedToken } = useAuth();
  const updated_by = decodedToken?.preferred_username; 
  const isBulk = selectedRoles.length >= 2;
  const [wasBulk, setWasBulk] = useState(false);
  const [deletedCount, setDeletedCount] = useState(0);

  useEffect(() => {
    if (showModal && roleName) {
      setIsDeleted(false);
      setIsLoading(false);
      fetchPolicyCount();
    }
  }, [showModal, roleName]);

  const fetchPolicyCount = async () => {
    setPolicyCountLoading(true);
    try {
      const response = await fetch(
        `${window._env_?.VITE_FAST_API}/auth/policies/count/role/${encodeURIComponent(roleName)}`,
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

  if (!showModal || !roleName) return null;

  const handleClose = () => {
    setIsDeleted(false);
    setIsLoading(false);
    setPolicyCount(null);
    setPolicyCountLoading(false);
    setShowModal(false);
  };

  const handleConfirmDelete = async () => {
    setIsLoading(true);
    const bulkSnapshot = isBulk;
    const countSnapshot = isBulk ? selectedRoles.length : 1;
    try {
      const name = isBulk ? selectedRoles : [roleName];
      const response = await fetch(`${window._env_?.VITE_FAST_API}/auth/deleterole`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: isBulk ? selectedRoles : [roleName], updated_by }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        toast.error(errorData?.detail || "Failed to delete role(s)");
        throw new Error(errorData?.detail || "Failed to delete role(s)");
      }
      setWasBulk(bulkSnapshot);
      setDeletedCount(countSnapshot);
      setIsDeleted(true);
      if (onConfirm) onConfirm();
    } catch (error) {
      console.error("Error deleting role(s):", error);
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
              {isDeleted ? (wasBulk ? "Roles Deleted" : "Role Deleted") : "Delete Confirmation"}
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
                {isBulk ? `Deleting ${selectedRoles.length} roles...` : "Deleting role..."}
              </p>
            </div>
          )}

          {isDeleted && (
            <div className="p-4 bg-green-50 rounded-lg text-center mb-6">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-lg font-medium text-gray-800 break-words">
                {wasBulk ? `${deletedCount} roles deleted successfully` : `Role "${roleName}" deleted successfully`}
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
                <p className="text-lg font-medium text-gray-800 break-words">
                  {isBulk ? `You are about to delete ${selectedRoles.length} roles` : `You are about to delete the role "${roleName}"`}
                </p>
                
                {/* Policy Count Warning - Before "This action cannot be undone" */}
                {policyCountLoading ? (
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <Loader className="h-4 w-4 text-gray-500 animate-spin" />
                    <p className="text-gray-500">Checking related policies...</p>
                  </div>
                ) : policyCount !== null && policyCount > 0 ? (
                  <p className="text-gray-500 mt-2">
                    This will also delete {policyCount} {policyCount === 1 ? "policy" : "policies"} linked to "{roleName}"
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

export default DeleteRole;
