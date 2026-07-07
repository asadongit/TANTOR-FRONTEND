import React, { useState, useEffect } from "react";
import { Info, Loader2 } from "lucide-react";
import { useAuth } from "../../../../../context/AuthContext";

function AddSubgroup({ showModal, setShowModal, onSubgroupAdded }) {
  const [formData, setFormData] = useState({
    name: "",
    group: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState("");
  const { token, decodedToken } = useAuth();

  // Add useEffect to reset form when modal is closed
  useEffect(() => {
    if (!showModal) {
      resetForm();
    }
  }, [showModal]);

  useEffect(() => {
    if (showModal) {
      fetchGroups();
    }
  }, [showModal]);

  const fetchGroups = async () => {
    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/auth/groupsdropdown`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch groups");
      }

      const data = await response.json();
      setGroups(data.groups || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
      setError("Failed to load groups. Please try again.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.group) {
      setError("Group is required");
      return;
    }
    if (!formData.name.trim()) {
      setError("Subgroup name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        name: formData.name,
        group: formData.group,
        description: formData.description,
        created_by: decodedToken?.preferred_username
      };

      const response = await fetch(`${window._env_?.VITE_FAST_API}/auth/addsubgroup`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to create subgroup");
      }

      setFormData({
        name: "",
        group: "",
        description: "",
      });

      setShowModal(false);
      if (onSubgroupAdded) {
        onSubgroupAdded({ success: true, message: "Subgroup created successfully" });
      }
    } catch (error) {
      console.error("Error creating subgroup:", error);
      if (onSubgroupAdded) {
        onSubgroupAdded({ success: false, error: error.message || "Failed to create subgroup" });
      }
      setError(error.message || "Failed to create subgroup");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      group: "",
      description: "",
    });
    setError("");
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

        <form
          onSubmit={handleSubmit}
          className="inline-block w-full max-w-xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg"
        >
          <h3 className="text-lg font-bold text-[#282F49] mb-6">Add Subgroup</h3>

          {error && (
            <div
              className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg"
              style={{
                maxHeight: "120px",
                overflowY: "auto",
                wordBreak: "break-all",
                whiteSpace: "pre-wrap",
              }}
            >
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Group <span className="text-red-500">*</span>
              </label>
              <select
                name="group"
                value={formData.group}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8f79b8] focus:border-transparent"
                disabled={loading}
              >
                <option value="">Select a group</option>
                {groups.map((group, index) => (
                  <option key={index} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Subgroup Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8f79b8] focus:border-transparent"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Description</label>
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
                type="button"
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="w-24 px-4 py-2 text-gray-700 bg-white border border-gray-400 hover:bg-gray-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-24 px-4 py-2 text-white bg-[#8e78b7] hover:bg-[#7d69a3] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddSubgroup;
