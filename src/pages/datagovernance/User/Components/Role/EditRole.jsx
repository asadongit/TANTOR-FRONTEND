import React, { useState, useEffect } from "react";
import { Icon } from "@iconify-icon/react";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../../../../context/AuthContext";

const EditRole = ({ show, onClose, onSave, roleData }) => {
  const [formData, setFormData] = useState({
    originalName: '',
    name: '',
    description: '',
    duration: {
      from: '',
      to: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    if (roleData && show) {
      setFormData({
        originalName: roleData.name,
        name: roleData.name,
        description: roleData.description || '',
        duration: {
          from: roleData.startDate || '',
          to: roleData.endDate || ''
        }
      });
      setError(null);
    }
  }, [roleData, show]);

  const handleSave = async () => {
    setError(null);

    if (!formData.name.trim()) {
      setError("Role name is required");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${window._env_?.VITE_FAST_API}/auth/editrole`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.originalName,
          new_name: formData.name,
          description: formData.description,
          startDate: formData.duration.from,
          endDate: formData.duration.to
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || 'Failed to update role');
      }

      const data = await response.json();
      onSave(data);
      onClose();
    } catch (err) {
      console.error('Error updating role:', err);
      setError(err.message || 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
        <div
          className="fixed inset-0 transition-opacity"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block w-full max-w-xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <h3 className="text-md font-bold mb-6">
            <span className="text-[#282F49]">Edit Role - </span>
            <span className="text-[#8f79b8]">{formData.originalName}</span>
          </h3>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm text-[#332849] font-bold mb-1">Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8f79b8] focus:border-transparent text-[#818181]"
                  disabled={loading}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-[#332849] font-bold mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8f79b8] focus:border-transparent text-[#818181]"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#332849]">Duration</h4>
              <div className="flex items-center gap-4 mt-2">
                <input
                  type="date"
                  placeholder="From"
                  value={formData.duration.from}
                  onChange={(e) => setFormData({
                    ...formData,
                    duration: { ...formData.duration, from: e.target.value },
                  })}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8f79b8] focus:border-transparent"
                  disabled={loading}
                />
                <span className="text-gray-400">→</span>
                <input
                  type="date"
                  placeholder="To"
                  value={formData.duration.to}
                  onChange={(e) => setFormData({
                    ...formData,
                    duration: { ...formData.duration, to: e.target.value },
                  })}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8f79b8] focus:border-transparent"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex justify-end items-center gap-3 mt-6">
              <button
                className="w-24 px-4 py-2 text-base bg-white text-gray-700 border border-gray-400 rounded-lg hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="w-24 flex items-center justify-center gap-2 px-4 py-2 text-base bg-[#8e78b7] text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditRole;
