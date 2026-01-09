import React, { useState } from 'react';
import { X, Search, AlertCircle, BadgeCheck } from 'lucide-react';
import { Icon } from '@iconify-icon/react';
import { useAuth } from "../../../../../context/AuthContext";
import successBackground from "../../../../../assets/green.png";

export const CreateProjectModal = ({ isOpen, onClose, onProjectCreated }) => {
  const {token, decodedToken, hostnameV1} = useAuth();
  const initialFormState = {
    project: "",
    description: "",
    assigned_users: { assigned_users: "" },
    created_by: decodedToken?.preferred_username || ""
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData((prev) => {
      if (name === "assigned_users") {
        return {
          ...prev,
          assigned_users: {
            ...prev.assigned_users,
            assigned_users: value,
          },
        };
      }
      return {
        ...prev,
        [name]: value,
      };
    });

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ""
      });
    }
  };

  const validateForm = () => {
    let formErrors = {};
    let isValid = true;

    if (!formData.project.trim()) {
      formErrors.project = "Project name is required";
      isValid = false;
    }

    const email = formData.assigned_users.assigned_users;
    if (!email.trim()) {
      formErrors.assigned_users = "Manager email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      formErrors.assigned_users = "Please enter a valid email address";
      isValid = false;
    }

    setErrors(formErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`${hostnameV1}/projects`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to create project");
      }

      const result = await response.json();

      setShowSuccessModal(true);
      
      if (onProjectCreated) {
        onProjectCreated();
      }
    } catch (error) {
      setErrors({ 
        ...errors, 
        api: error.message || "Failed to create project. Please try again." 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData(initialFormState);
    setErrors({});
    setShowSuccessModal(false);
    onClose();
  };

  const handleSuccessClose = () => {
    setFormData(initialFormState);
    setErrors({});
    setShowSuccessModal(false);
    onClose();
  };

  if (!isOpen) return null;

  if (showSuccessModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl w-[600px] overflow-hidden shadow-xl">
          <div className="relative h-24">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${successBackground})` }}
            >
              <button
                onClick={handleSuccessClose}
                className="absolute top-4 right-4 text-black p-1 hover:bg-white hover:bg-opacity-20 rounded-full"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="p-8">
            <div className="flex items-center space-x-4 mb-4">
              <BadgeCheck className="w-8 h-8 text-green-500" />
              <h2 className="text-2xl font-bold">Congratulations!</h2>
            </div>
            <p className="text-lg text-gray-800 mb-2">
              You have successfully created a project "{formData.project}".
            </p>

            <div className="flex justify-start gap-4 mt-8">
              <button
                onClick={handleSuccessClose}
                className="px-6 py-3 text-lg bg-[#8e78b7] text-white rounded-lg hover:bg-[#7a66a3] transition-colors"
              >
                Alright
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-[1000px] p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div>
              <Icon
                className="h-5 w-5 text-[#8e78b7]"
                icon="material-symbols:tactic-rounded"
                width="24"
                height="24"
              />
            </div>
            <h2 className="text-xl font-bold text-[#8e78b7]">
              Create a Project
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errors.api && (
          <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-lg flex items-center">
            <AlertCircle className="mr-2 h-5 w-5" />
            {errors.api}
          </div>
        )}

        <div className="grid grid-cols-3 gap-8">
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-black mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="project"
                  value={formData.project}
                  onChange={handleInputChange}
                  placeholder="Name"
                  disabled={isSubmitting}
                  className={`w-full p-2.5 border ${errors.project ? 'border-red-500' : 'border-gray-400'} rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]`}
                />
                {errors.project && (
                  <p className="mt-1 text-sm text-red-500">{errors.project}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-black mb-1.5">
                  Description
                </label>
                <input
                  name="description"
                  type="text"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Description"
                  disabled={isSubmitting}
                  className="w-full p-2.5 border border-gray-400 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <div className="relative">
                  <label className="block text-sm text-black mb-1.5">
                    Manager <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="assigned_users"
                    value={formData.assigned_users.assigned_users}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        assigned_users: { assigned_users: e.target.value },
                      }))
                    }
                    placeholder="Manager"
                    disabled={isSubmitting}
                    className={`w-full p-2.5 border ${errors.assigned_users ? 'border-red-500' : 'border-gray-400'} rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]`}
                  />
                  <Search
                    className="absolute right-3 top-10 pointer-events-none text-gray-500"
                    size={18}
                  />
                  {errors.assigned_users && (
                    <p className="mt-1 text-sm text-red-500">{errors.assigned_users}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-start gap-4 mt-8">
          <button
            onClick={handleClose}
            className="px-6 py-2 border border-gray-400 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-6 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7a66a3] transition-colors ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};