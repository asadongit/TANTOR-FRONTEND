import React, { useState, useEffect } from "react";
import { Icon } from "@iconify-icon/react";
import { Plus, Loader2, Info } from "lucide-react";
import { useAuth } from "../../../../../context/AuthContext";

const AddRole = ({ show, onClose, onSave }) => {
  const [formData, setFormData] = useState({
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
    if (!show) {
      resetForm();
    }
  }, [show]);

  const handleSave = async () => {
    setError(null);

    if (!formData.name.trim()) {
      setError("Role name is required");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${window._env_?.VITE_FAST_API}/auth/createrole`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          startDate: formData.duration.from,
          endDate: formData.duration.to
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || 'Failed to create role');
      }

      const data = await response.json();
      onSave({ success: true, data, message: 'Role created successfully' });
      onClose();
    } catch (err) {
      console.error('Error creating role:', err);
      setError(err.message || 'Failed to create role');
      onSave({ success: false, error: err.message || 'Failed to create role' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      duration: {
        from: '',
        to: ''
      }
    });
    setError(null);
  };

  const handleNewRole = () => {
    resetForm();
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
          <div className="flex items-center mb-6">
            <h3 className="text-md font-bold text-[#8f79b8] mr-2">
              Add Role
            </h3>
            <div className="relative group">
              <Info className="h-4 w-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" />
              <div className="absolute left-0 mt-2 w-48 bg-gray-900 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-10 whitespace-normal">
                Create a new role with a name, description, and optional validity period.
              </div>
            </div>
          </div>

          {error && (
            <div
              className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg"
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
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full h-10 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8f79b8] focus:border-transparent"
                  disabled={loading}
                />
              </div>
              
              <div className="flex-1">
                <label className="block text-sm text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full h-10 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8f79b8] focus:border-transparent"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-[#8f79b8]">Duration</h4>
              <div className="flex items-center gap-4 mt-2">
                <input
                  type="date"
                  placeholder="Start Date"
                  value={formData.duration.from}
                  onChange={(e) => setFormData({
                    ...formData,
                    duration: { ...formData.duration, from: e.target.value },
                  })}
                  className="flex-1 h-10 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8f79b8] focus:border-transparent"
                  disabled={loading}
                />
                <span className="text-gray-400 px-2">→</span>
                <input
                  type="date"
                  placeholder="End Date"
                  value={formData.duration.to}
                  onChange={(e) => setFormData({
                    ...formData,
                    duration: { ...formData.duration, to: e.target.value },
                  })}
                  className="flex-1 h-10 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8f79b8] focus:border-transparent"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex justify-between items-center mt-6">
              <div className="flex items-center gap-3">
                <button
                  className="w-20 px-4 py-2 text-base bg-[#8e78b7] text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="w-20 flex items-center justify-center gap-2 px-4 py-2 text-base bg-[#8e78b7] text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
              {/* <button
                className="flex items-center gap-2 px-4 py-2 text-[#8e78b7] border border-[#8e78b7] hover:bg-[#8e78b7] hover:text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleNewRole}
                disabled={loading}
              >
                <Plus className="h-5 w-5" />
                New Role
              </button> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddRole;
