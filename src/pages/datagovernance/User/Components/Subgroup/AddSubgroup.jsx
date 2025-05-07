import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
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
  const { token } = useAuth();

  useEffect(() => {
    if (showModal) {
      fetchGroups();
    }
  }, [showModal]);

  const fetchGroups = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_FAST_API}/auth/groupsdropdown`, {
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
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${import.meta.env.VITE_FAST_API}/auth/addsubgroup`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to create subgroup");
      }

      // Reset form
      setFormData({
        name: "",
        group: "",
        description: "",
      });

      // Close modal and refresh data
      setShowModal(false);
      if (onSubgroupAdded) {
        onSubgroupAdded();
      }
    } catch (error) {
      console.error("Error creating subgroup:", error);
      setError(error.message || "Failed to create subgroup");
    } finally {
      setLoading(false);
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Add Subgroup</h3>
          <button
            onClick={() => setShowModal(false)}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group*
            </label>
            <select
              name="group"
              value={formData.group}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subgroup Name*
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter subgroup name"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Enter description"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-[#8e78b7] text-white rounded-md hover:bg-[#8e78b7] flex items-center"

              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Adding...
                </>
              ) : (
                "Add Subgroup"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddSubgroup;
