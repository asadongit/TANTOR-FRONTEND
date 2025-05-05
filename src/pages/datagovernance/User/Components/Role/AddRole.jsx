import React, { useState } from "react";
import { Icon } from "@iconify-icon/react";
import { Plus } from "lucide-react";

const AddRole = ({ show, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: {
      from: '',
      to: ''
    }
  });

  const handleSave = () => {
    onSave(formData);
  };

  const handleNewRole = () => {
    setFormData({
      name: '',
      description: '',
      duration: {
        from: '',
        to: ''
      }
    });
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
          <div className="flex items-center gap-2 mb-6">
            <Icon icon="material-symbols:supervisor-account-outline" width="24" height="24" className="text-[#8f79b8]" />
            <h3 className="text-lg font-bold text-[#8f79b8]">New role</h3>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8f79b8] focus:border-transparent"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8f79b8] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-[#8f79b8]">Duration</h4>
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
                />
              </div>
            </div>

            <div className="flex justify-between items-center mt-6">
              <div className="flex gap-3">
                <button
                  className="px-4 py-2 text-[#8e78b7] border border-[#8e78b7] hover:bg-[#8e78b7] hover:text-white rounded-lg"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-[#8e78b7] border border-[#8e78b7] hover:bg-[#8e78b7] hover:text-white rounded-lg"
                >
                  Save
                </button>
              </div>
              <button
                className="flex items-center gap-2 px-4 py-2 text-[#8e78b7] border border-[#8e78b7] hover:bg-[#8e78b7] hover:text-white rounded-lg"
                onClick={handleNewRole}
              >
                <Plus className="h-5 w-5" />
                New Role
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddRole;
