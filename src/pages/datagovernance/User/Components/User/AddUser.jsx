import React, { useState, useEffect, useRef } from 'react';
import { X, Loader, Check, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Icon } from "@iconify-icon/react";
import { useAuth } from '../../../../../context/AuthContext';
import AssignPolicyModal from './AssignPolicyModal';
import Policy from '../../../DataShield/Policy';
import { ToastContainer, toast } from "react-toastify";

const AddUser = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    email: '',
    roles: [],
    persona: [],
    groups: [],
    subgroups: [],
    datapolicy: []
  });
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [isPolicyStepperOpen, setIsPolicyStepperOpen] = useState(false);
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
  const [existingPolicies, setExistingPolicies] = useState([]); // For existing policies
  const [newPolicies, setNewPolicies] = useState([]); // For newly created policies

  // Combine policies for display and form data
  const allPolicies = [...existingPolicies, ...newPolicies];

  useEffect(() => {
    if (isOpen) {
      setApiResponse({ status: null, message: '' });
      fetchDropdownOptions();
      setFormData({
        username: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        email: '',
        roles: [],
        persona: [],
        groups: [],
        subgroups: [],
        datapolicy: []
      });
      setExistingPolicies([]);
      setNewPolicies([]);
    }
  }, [isOpen]);

  const handleClose = () => {
    setApiResponse({ status: null, message: '' });
    setIsPolicyStepperOpen(false);
    setExistingPolicies([]);
    setNewPolicies([]);
    onClose();
  };

  useEffect(() => {
    if (formData.groups.length > 0) {
      fetchSubgroups(formData.groups);
    } else {
      setDropdownOptions(prev => ({
        ...prev,
        subgroups: []
      }));
    }
  }, [formData.groups]);

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

  const fetchSubgroups = async (groups) => {
    setIsLoadingSubgroups(true);
    try {
      const subgroupPromises = groups.map(group =>
        fetch(`${import.meta.env.VITE_FAST_API}/auth/datapolicy/subgroup/${group}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).then(res => res.json())
      );

      const results = await Promise.all(subgroupPromises);

      const allSubgroups = Array.from(new Set(
        results.flatMap(data => data.subgroups || [])
      ));

      setDropdownOptions(prev => ({
        ...prev,
        subgroups: allSubgroups
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

  const updateFormDataFromPolicies = (policies) => {
    const combinedRoles = new Set();
    const combinedPersonas = new Set();
    const combinedGroups = new Set();
    const combinedSubgroups = new Set();
    const dataPolicyIds = policies.map(policy => policy.id);

    policies.forEach(policy => {
      if (policy.roles && Array.isArray(policy.roles)) {
        policy.roles.forEach(role => role && combinedRoles.add(role));
      }
      if (policy.persona && Array.isArray(policy.persona)) {
        policy.persona.forEach(p => p && combinedPersonas.add(p));
      }
      if (policy.groups && Array.isArray(policy.groups)) {
        policy.groups.forEach(group => group && combinedGroups.add(group));
      }
      if (policy.subgroups && Array.isArray(policy.subgroups)) {
        policy.subgroups.forEach(subgroup => subgroup && combinedSubgroups.add(subgroup));
      }
    });

    setFormData(prev => ({
      ...prev,
      roles: Array.from(combinedRoles),
      persona: Array.from(combinedPersonas),
      groups: Array.from(combinedGroups),
      subgroups: Array.from(combinedSubgroups),
      datapolicy: dataPolicyIds
    }));

    setErrors(prev => ({
      ...prev,
      roles: '',
      policyAssignment: ''
    }));
  };

  const handleApplyPoliciesFromModal = (appliedData) => {
    const newExistingPolicies = appliedData.datapolicy.map(id => ({
      id,
      name: appliedData.sub_policy_name || `Policy ${id}`,
      roles: appliedData.roles || [],
      persona: appliedData.persona || [],
      groups: appliedData.groups || [],
      subgroups: appliedData.subgroups || []
    }));

    setExistingPolicies(newExistingPolicies);
    updateFormDataFromPolicies([...newExistingPolicies, ...newPolicies]);
    setIsPolicyModalOpen(false);
  };

  const handlePolicyComplete = (policyDetails) => {
    const newPolicy = {
      id: policyDetails.id,
      name: policyDetails.sub_policy_name || `Policy ${policyDetails.id}`,
      roles: policyDetails.roles || [],
      persona: policyDetails.persona || [],
      groups: policyDetails.group || [],
      subgroups: policyDetails.subgroups || []
    };

    setNewPolicies(prev => [...prev, newPolicy]);
    updateFormDataFromPolicies([...existingPolicies, ...newPolicies, newPolicy]);
    setIsPolicyStepperOpen(false);
  };

  const handleRemovePolicy = (policyId) => {
    const updatedExistingPolicies = existingPolicies.filter(policy => policy.id !== policyId);
    const updatedNewPolicies = newPolicies.filter(policy => policy.id !== policyId);
    setExistingPolicies(updatedExistingPolicies);
    setNewPolicies(updatedNewPolicies);
    updateFormDataFromPolicies([...updatedExistingPolicies, ...updatedNewPolicies]);
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const SearchableMultiSelect = ({
    title,
    options,
    name,
    selectedValues,
    onSelectionChange,
    disabled = false,
    loading = false,
    required = false
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dropdownDirection, setDropdownDirection] = useState('down');
    const dropdownRef = useRef(null);
    const dropdownTriggerRef = useRef(null);

    useEffect(() => {
      if (isOpen && dropdownTriggerRef.current) {
        const triggerRect = dropdownTriggerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - triggerRect.bottom;
        setDropdownDirection(spaceBelow < 200 ? 'up' : 'down');
      }
    }, [isOpen]);

    const filteredOptions = options.filter(option =>
      option.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    const handleToggle = (value) => {
      if (selectedValues.includes(value)) {
        onSelectionChange(name, selectedValues.filter(item => item !== value));
      } else {
        onSelectionChange(name, [...selectedValues, value]);
      }
    };

    return (
      <div className="relative" ref={dropdownRef}>
        <label className="block text-sm text-black mb-1.5">
          {title} {required && <span className="text-red-500">*</span>}
        </label>
        <div
          ref={dropdownTriggerRef}
          onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
          className={`w-full p-2.5 border ${errors[name] ? 'border-red-500' : 'border-gray-400'} rounded-lg flex justify-between items-center cursor-pointer bg-white ${disabled || loading ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <div className="flex flex-wrap gap-1 flex-1 min-h-6">
            {selectedValues.length === 0 ? (
              <span className="text-gray-500">Select {title.toLowerCase()}</span>
            ) : (
              selectedValues.map((value, index) => (
                <span
                  key={value}
                  className="bg-[#8e78b7] bg-opacity-20 text-[#8e78b7] px-2 py-0.5 rounded text-sm flex items-center"
                >
                  {value}
                  {!disabled && (
                    <X
                      className="h-3 w-3 ml-1 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggle(value);
                      }}
                    />
                  )}
                </span>
              ))
            )}
          </div>
          {loading ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
          )}
        </div>

        {isOpen && !disabled && !loading && (
          <div className={`absolute z-10 w-full ${dropdownDirection === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'} bg-white border border-gray-300 rounded-lg shadow-lg`}>
            <div className="p-2 border-b">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={`Search ${title.toLowerCase()}`}
                  className="w-full p-2 pl-8 border border-gray-300 rounded-md focus:outline-none focus:border-[#8e78b7]"
                  onClick={(e) => e.stopPropagation()}
                />
                <Search className="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto p-1">
              {filteredOptions.length === 0 ? (
                <div className="text-center py-2 text-gray-500">No {title.toLowerCase()} found</div>
              ) : (
                filteredOptions.map(option => (
                  <div
                    key={option}
                    className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(option);
                    }}
                  >
                    <input
                      type="checkbox"
                      id={`${name}-${option}`}
                      checked={selectedValues.includes(option)}
                      onChange={() => { }}
                      className="cursor-pointer text-[#8e78b7] focus:ring-[#8e78b7] rounded"
                    />
                    <label
                      htmlFor={`${name}-${option}`}
                      className="ml-2 text-sm cursor-pointer select-none flex-1"
                    >
                      {option}
                    </label>
                  </div>
                ))
              )}
            </div>
            {selectedValues.length > 0 && (
              <div className="p-2 border-t flex justify-between items-center">
                <span className="text-xs text-gray-500">{selectedValues.length} selected</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectionChange(name, []);
                  }}
                  className="text-xs text-[#8e78b7] hover:underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        )}

        {errors[name] && (
          <p className="mt-1 text-sm text-red-500">{errors[name]}</p>
        )}
      </div>
    );
  };

  const handleCheckboxChange = (name, selectedItems) => {
    setFormData(prev => ({
      ...prev,
      [name]: selectedItems
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    if (name === 'groups') {
      setFormData(prev => ({
        ...prev,
        subgroups: []
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.username.trim()) newErrors.username = 'Username is required';
    else if (formData.username.length > 64) newErrors.username = 'Username must be 64 characters or less';

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordRegex = {
        length: /.{8,}/,
        uppercase: /[A-Z]/,
        lowercase: /[a-z]/,
        number: /[0-9]/,
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/
      };

      const passwordErrors = [];

      if (!passwordRegex.length.test(formData.password))
        passwordErrors.push('at least 8 characters');
      if (!passwordRegex.uppercase.test(formData.password))
        passwordErrors.push('one uppercase letter');
      if (!passwordRegex.lowercase.test(formData.password))
        passwordErrors.push('one lowercase letter');
      if (!passwordRegex.number.test(formData.password))
        passwordErrors.push('one number');
      if (!passwordRegex.special.test(formData.password))
        passwordErrors.push('one special character');

      if (passwordErrors.length > 0) {
        newErrors.password = `Password must contain ${passwordErrors.join(', ')}`;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    } else {
      const emailParts = formData.email.split('@');
      const localPart = emailParts[0];
      if (/^\d+$/.test(localPart)) {
        newErrors.email = 'Email address cannot consist of numbers only before @';
      }
    }
    if (formData.datapolicy.length === 0) {
      newErrors.policyAssignment = 'Please select at least one policy';
    }

    return newErrors;
  };

  const handleSubmit = async () => {
    console.log("form data is ==========>", formData);
    setApiResponse({ status: null, message: '' });

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    let payload = {
      username: formData.username,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      roles_assigned: formData.roles,
      persona: formData.persona.length === 0 ? [""] : formData.persona,
      group: formData.groups,
      subgroup: formData.subgroups,
      datapolicy: formData.datapolicy
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_FAST_API}/auth/signup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
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
          roles: [],
          persona: [],
          groups: [],
          subgroups: [],
          datapolicy: []
        });
        setErrors({});
        setApiResponse({ status: null, message: '' });
        setExistingPolicies([]);
        setNewPolicies([]);
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

  const TagInput = ({ value, onChange, placeholder }) => {
    const [input, setInput] = useState('');
    const inputRef = useRef(null);

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && input.trim()) {
        e.preventDefault();
        if (!value.includes(input.trim())) {
          onChange([...value, input.trim()]);
        }
        setInput('');
      } else if (e.key === 'Backspace' && !input && value.length > 0) {
        onChange(value.slice(0, value.length - 1));
      }
    };

    const handleRemoveTag = (tagToRemove) => {
      onChange(value.filter(tag => tag !== tagToRemove));
    };

    return (
      <div
        className={`flex flex-wrap items-center gap-2 p-2.5 border border-gray-400 rounded-lg focus-within:border-[#8e78b7] focus-within:ring-1 focus-within:ring-[#8e78b7] bg-white`}
        onClick={() => inputRef.current.focus()}
      >
        {value.map((tag, index) => (
          <span
            key={index}
            className="bg-[#8e78b7] bg-opacity-20 text-[#8e78b7] px-2 py-0.5 rounded text-sm flex items-center"
          >
            {tag}
            <X
              className="h-3 w-3 ml-1 cursor-pointer"
              onClick={() => handleRemoveTag(tag)}
            />
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-grow outline-none text-sm min-w-[120px]"
        />
      </div>
    );
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
          <div className={`mb-6 p-3 rounded-lg text-center ${apiResponse.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
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
                <p className="mt-1 text-xs text-gray-500">
                  Password must contain at least 8 characters, including uppercase, lowercase,
                  numbers, and special characters.
                </p>
              </div>
              <div>
                <label className="block text-sm text-black mb-1.5">Confirm password <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  className={`w-full p-1.5 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-400'} rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]`}
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
              <div className="space-y-4 mt-4">
                <button
                  onClick={() => setIsPolicyModalOpen(true)}
                  className="w-full px-4 py-2 border border-gray-400 rounded-lg bg-gray-100 hover:bg-[#8e78b7] hover:text-white transition-colors text-black"
                  type="button"
                >
                  Select existing policy
                </button>
                <button
                  onClick={() => {
                    console.log("Assign New Policy clicked");
                    setIsPolicyStepperOpen(true);
                  }}
                  className="w-full px-4 py-2 border border-gray-400 rounded-lg bg-gray-100 hover:bg-[#8e78b7] hover:text-white transition-colors text-black"
                  type="button"
                >
                  Add new policy
                </button>

                {allPolicies.length > 0 && (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm font-medium mb-2">Assigned Policies:</p>
                    <div className="max-h-52 overflow-y-auto space-y-2 pr-2">
                      {allPolicies.map(policy => (
                        <div key={policy.id} className="flex items-center justify-between bg-white p-2 rounded border border-gray-100">
                          <div>
                            <p className="text-sm">
                              Policy ID : {policy.id}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemovePolicy(policy.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {errors.policyAssignment && (
                  <p className="mt-2 text-sm text-red-500">{errors.policyAssignment}</p>
                )}

                <p className="mt-2 text-sm text-gray-600">
                  Policies will determine the user's roles, persona, groups, and sub-groups.
                </p>
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
      <AssignPolicyModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        onApplyPolicies={handleApplyPoliciesFromModal}
        initialSelectedPolicyIds={existingPolicies.map(policy => policy.id)}
      />
      <Policy
        isEmbedded={true}
        isOpen={isPolicyStepperOpen}
        onClose={() => setIsPolicyStepperOpen(false)}
        onPolicyComplete={handlePolicyComplete}
      />
    </div>
  );
};

export default AddUser;