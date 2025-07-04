import React, { useState, useEffect } from "react";
import { Info } from "lucide-react";
import { useAuth } from "../../../../../context/AuthContext";

function EditGroup({ showModal, setShowModal, groupData, onGroupEdited }) {
  const [formData, setFormData] = useState({
    newName: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    if (groupData) {
      setFormData({
        newName: groupData.name || "",
        description: groupData.description || "",
      });
    }
  }, [groupData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleUpdate = async () => {
    // Validate form data
    if (!formData.newName.trim()) {
      setError("Group name is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/auth/editgroup`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: groupData.name,
          new_name: formData.newName,
          description: formData.description,
          createdOn: groupData.createdDate || new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Group updated successfully:", data);

      // Close modal
      setShowModal(false);

      // Notify parent component to refresh data
      if (onGroupEdited) onGroupEdited();

    } catch (error) {
      console.error("Error updating group:", error);
      setError(error.message || "Failed to update group. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
        <div
          className="fixed inset-0 transition-opacity"
          onClick={() => !loading && setShowModal(false)}
        >
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block w-full max-w-xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="text-lg font-bold text-[#8f79b8] mr-2">
              Edit Group
            </h3>
            <Info className="h-5 w-5 text-gray-400" />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Current Group Name
              </label>
              <input
                type="text"
                value={groupData?.name || ""}
                className="w-full px-3 py-2 border border-gray-400 rounded-lg bg-gray-100 cursor-not-allowed"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                New Group Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="newName"
                value={formData.newName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8f79b8] focus:border-transparent"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8f79b8] focus:border-transparent"
                rows="6"
                disabled={loading}
              ></textarea>
            </div>

            <div className="flex justify-between items-center mt-6">
              <div className="flex gap-3">
                <button
                  className="px-4 py-2 text-[#8e78b7] border border-[#8e78b7] hover:bg-[#8e78b7] hover:text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={loading}
                  className="px-4 py-2 text-white bg-[#8e78b7] border border-[#8e78b7] hover:bg-[#7d69a3] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    "Update"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditGroup;
