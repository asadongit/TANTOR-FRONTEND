import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Icon } from "@iconify-icon/react";
import { useAuth } from "../../../../../context/AuthContext";

function EditSubgroup({ showModal, setShowModal, subgroupData, onSubgroupUpdated }) {
  const [formData, setFormData] = useState({
    name: "",
    new_name: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { token, decodedToken } = useAuth();

  useEffect(() => {
    if (showModal && subgroupData) {
      setFormData({
        name: subgroupData.name,
        new_name: subgroupData.name,
        description: subgroupData.description || "",
      });
      setError("");
    }
  }, [showModal, subgroupData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // validate
    if (!formData.new_name || !formData.new_name.trim()) {
      setError("Subgroup name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/auth/editsubgroup`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          new_name: formData.new_name,
          description: formData.description,
          updated_by: decodedToken?.preferred_username
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error: ${response.status} ${response.statusText}`);
      }

      // Close modal and notify parent
      setShowModal(false);
      if (onSubgroupUpdated) onSubgroupUpdated();
    } catch (err) {
      console.error("Error updating subgroup:", err);
      setError(err.message || "Failed to update subgroup. Please try again.");
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

        <form
          onSubmit={handleSubmit}
          className="inline-block w-full max-w-xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">
              <span className="text-[#332849]">Edit Subgroup - </span>
              <span className="text-[#8f79b8]">{formData.new_name || subgroupData?.name}</span>
            </h3>

            <button
              type="button"
              onClick={() => !loading && setShowModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
              disabled={loading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

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
              <label className="block text-sm text-[#332849] font-bold mb-1">
                Current Name
              </label>
              <input
                type="text"
                value={subgroupData?.name || ""}
                className="w-full px-3 py-2 border border-gray-400 rounded-lg bg-gray-100 cursor-not-allowed text-[#818181]"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm text-[#332849] font-bold mb-1">
                New Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="new_name"
                value={formData.new_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8f79b8] focus:border-transparent text-[#818181]"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-sm text-[#332849] font-bold mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8f79b8] focus:border-transparent text-[#818181]"
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
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  "Update"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditSubgroup;
