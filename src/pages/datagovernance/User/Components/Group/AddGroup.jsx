import React, { useState, useEffect } from "react";
import { Info } from "lucide-react";
import { useAuth } from "../../../../../context/AuthContext";

function AddGroup({ showModal, setShowModal, onGroupAdded }) {
  const [formData, setFormData] = useState({
    groupname: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  // Add useEffect to reset form when modal is closed
  useEffect(() => {
    if (!showModal) {
      resetForm();
    }
  }, [showModal]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async () => {
    if (!formData.groupname.trim()) {
      setError("Group name is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/auth/addgroup`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.groupname,
          description: formData.description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (onGroupAdded) {
        onGroupAdded({ success: true, message: 'Group created successfully' });
      }

      setShowModal(false);
    } catch (error) {
      console.error("Error creating group:", error);
      if (onGroupAdded) {
        onGroupAdded({ success: false, error: error.message || "Failed to create group. Please try again." });
      }
      setError(error.message || "Failed to create group. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ groupname: "", description: "" });
    setError(null);
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

        <div className="inline-block w-full max-w-xl p-6 my-8 overflow-visible text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <h3 className="text-lg font-bold text-[#282F49] mb-6">
            Add Group
          </h3>

          {error && (
            <div
              className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg"
              style={{
                maxHeight: "120px",
                overflowY: "auto",
                wordBreak: "break-all",
                whiteSpace: "pre-wrap"
              }}
            >
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Group Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="groupname"
                value={formData.groupname}
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

            <div className="flex justify-end items-center gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="w-24 px-4 py-2 text-gray-700 bg-white border border-gray-400 hover:bg-gray-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="w-24 px-4 py-2 text-white bg-[#8e78b7] hover:bg-[#7d69a3] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddGroup;
