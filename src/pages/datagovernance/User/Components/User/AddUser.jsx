import React, { useState, useEffect } from 'react';
import { X, Loader } from 'lucide-react';
import { Icon } from "@iconify-icon/react";
import { useAuth } from '../../../../../context/AuthContext';

const AddUser = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    persona: '',
    group: '',
    subgroup: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState({ status: null, message: '' });
  const [dropdownOptions, setDropdownOptions] = useState({
    roles: [],
    groups: [],
    subgroups: []
  });
  const [isFetchingOptions, setIsFetchingOptions] = useState(false);
  const [isLoadingSubgroups, setIsLoadingSubgroups] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setApiResponse({ status: null, message: '' });
      fetchDropdownOptions();
    }
  }, [isOpen]);

  const handleClose = () => {
    setApiResponse({ status: null, message: '' });
    onClose();
  };

  useEffect(() => {
    if (formData.group) {
      fetchSubgroups(formData.group);
    }
  }, [formData.group]);

  const fetchDropdownOptions = async () => {
    setIsFetchingOptions(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_FAST_API}/auth/usermapper`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error('Failed to fetch dropdown options');
      }

      setDropdownOptions({
        roles: data.roles || [],
        groups: data.groups || [],
        subgroups: []
      });
    } catch (error) {
      console.error("Error fetching dropdown options:", error);
      setApiResponse({
        status: 'error',
        message: 'Failed to load form options'
      });
    } finally {
      setIsFetchingOptions(false);
    }
  };

  const fetchSubgroups = async (group) => {
    setIsLoadingSubgroups(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_FAST_API}/auth/datapolicy/subgroup/${group}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error('Failed to fetch subgroups');
      }

      setDropdownOptions(prev => ({
        ...prev,
        subgroups: data.subgroups || []
      }));
    } catch (error) {
      console.error("Error fetching subgroups:", error);
      setApiResponse({
        status: 'error',
        message: 'Failed to load subgroups'
      });
      setDropdownOptions(prev => ({
        ...prev,
        subgroups: []
      }));
    } finally {
      setIsLoadingSubgroups(false);
    }
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'group') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        subgroup: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.username.trim()) newErrors.username = 'Username is required';
    else if (formData.username.length > 64) newErrors.username = 'Username must be 64 characters or less';

    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.role) newErrors.role = 'Role is required';

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    return newErrors;
  };

  const handleSubmit = async () => {
    setApiResponse({ status: null, message: '' });

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_FAST_API}/auth/signup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          roles_assigned: formData.role,
          persona: formData.persona,
          group: formData.group,
          subgroup: formData.subgroup
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create user');
      }

      setApiResponse({
        status: 'success',
        message: 'User created successfully'
      });

      setTimeout(() => {
        onSave();
        setFormData({
          username: '',
          password: '',
          confirmPassword: '',
          firstName: '',
          lastName: '',
          email: '',
          role: '',
          persona: '',
          group: '',
          subgroup: '',
        });
      }, 1500);

    } catch (error) {
      setApiResponse({
        status: 'error',
        message: error.message || 'An error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-[1000px] p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div>
              <Icon className="h-5 w-5 text-[#8e78b7]" icon={"material-symbols:supervisor-account-outline"} width="24" height="24" />
            </div>
            <h2 className="text-xl font-bold text-[#8e78b7]">Add user</h2>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {apiResponse.status && (
          <div className={`mb-6 p-3 rounded-lg text-center ${
            apiResponse.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {apiResponse.message}
          </div>
        )}

        <div className="grid grid-cols-3 gap-8">
          <div className="space-y-6">
            <h3 className="text-[#8e78b7] font-medium">User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-black mb-1.5">User name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="User name"
                  className={`w-full p-2.5 border ${errors.username ? 'border-red-500' : 'border-gray-400'} rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]`}
                />
                {errors.username && <p className="mt-1 text-sm text-red-500">{errors.username}</p>}
              </div>
              <div>
                <label className="block text-sm text-black mb-1.5">Password <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className={`w-full p-2.5 border ${errors.password ? 'border-red-500' : 'border-gray-400'} rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]`}
                />
                {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
              </div>
              <div>
                <label className="block text-sm text-black mb-1.5">Confirm password <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  className={`w-full p-2.5 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-400'} rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]`}
                />
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[#8e78b7] font-medium">User information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-black mb-1.5">First name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First name"
                  className={`w-full p-2.5 border ${errors.firstName ? 'border-red-500' : 'border-gray-400'} rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]`}
                />
                {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-sm text-black mb-1.5">Last name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last name"
                  className={`w-full p-2.5 border ${errors.lastName ? 'border-red-500' : 'border-gray-400'} rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]`}
                />
                {errors.lastName && <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>}
              </div>
              <div>
                <label className="block text-sm text-black mb-1.5">Email id <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email id"
                  className={`w-full p-2.5 border ${errors.email ? 'border-red-500' : 'border-gray-400'} rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]`}
                />
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[#8e78b7] font-medium">Roles</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-black mb-1.5">Roles <span className="text-red-500">*</span></label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={`w-full p-2.5 border ${errors.role ? 'border-red-500' : 'border-gray-400'} rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] appearance-none bg-white`}
                >
                  <option value="">Select Role</option>
                  {isFetchingOptions ? (
                    <option value="" disabled>Loading roles...</option>
                  ) : (
                    dropdownOptions.roles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))
                  )}
                </select>
                {errors.role && <p className="mt-1 text-sm text-red-500">{errors.role}</p>}
              </div>
              <div>
                <label className="block text-sm text-black mb-1.5">Persona</label>
                <input
                  type="text"
                  name="persona"
                  value={formData.persona}
                  onChange={handleChange}
                  placeholder="Enter persona"
                  className="w-full p-2.5 border border-gray-400 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]"
                />
              </div>
              <div>
                <label className="block text-sm text-black mb-1.5">Group</label>
                <select
                  name="group"
                  value={formData.group}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-gray-400 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] appearance-none bg-white"
                >
                  <option value="">Select Group</option>
                  {isFetchingOptions ? (
                    <option value="" disabled>Loading groups...</option>
                  ) : (
                    dropdownOptions.groups.map(group => (
                      <option key={group} value={group}>{group}</option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm text-black mb-1.5">Sub-group</label>
                <select
                  name="subgroup"
                  value={formData.subgroup}
                  onChange={handleChange}
                  disabled={!formData.group || isLoadingSubgroups}
                  className="w-full p-2.5 border border-gray-400 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] appearance-none bg-white"
                >
                  <option value="">Select Sub-group</option>
                  {isLoadingSubgroups ? (
                    <option value="" disabled>Loading subgroups...</option>
                  ) : !formData.group ? (
                    <option value="" disabled>Select a group first</option>
                  ) : (
                    dropdownOptions.subgroups.map(subgroup => (
                      <option key={subgroup} value={subgroup}>{subgroup}</option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-start gap-4 mt-8">
          <button
            onClick={handleClose}
            className="px-6 py-2 border border-gray-400 rounded-lg hover:bg-[#8e78b7] hover:text-white transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-2 border border-gray-400 rounded-lg hover:bg-[#8e78b7] hover:text-white transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddUser;