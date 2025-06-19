import React, { useState, useEffect, useRef } from 'react';
import { X, Loader, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Icon } from "@iconify-icon/react";
import { useAuth } from '../../../../../context/AuthContext';
import AssignPolicyModal from './AssignPolicyModal';
import Policy from '../../../DataShield/Policy';

const EditUser = ({ isOpen, onClose, onSave, userData }) => {
  const [formData, setFormData] = useState({
    username: '',
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
  const [existingPolicies, setExistingPolicies] = useState([]);
  const [newPolicies, setNewPolicies] = useState([]);

  const allPolicies = [...existingPolicies, ...newPolicies];

  useEffect(() => {
    if (isOpen && userData) {
      setFormData({
        username: userData.username || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        roles: userData.roles ? (Array.isArray(userData.roles) ? userData.roles : [userData.roles]) : [],
        persona: userData.persona ? (Array.isArray(userData.persona) ? userData.persona : [userData.persona]) : [],
        groups: userData.group_subgroup ? Object.keys(userData.group_subgroup) :
          (userData.group ? [userData.group] : []),
        subgroups: getSubgroupsFromData(userData),
        datapolicy: userData.datapolicy || []
      });

      if (userData.datapolicy && userData.datapolicy.length > 0) {
        fetchPolicyDetails(userData.datapolicy);
      }

      setApiResponse({ status: null, message: '' });
      // fetchDropdownOptions();
    }
    if (!isOpen) {
      setApiResponse({ status: null, message: '' });
      setExistingPolicies([]);
      setNewPolicies([]);
    }
  }, [isOpen, userData]);

  const getSubgroupsFromData = (user) => {
    if (user.group_subgroup) {
      const subgroups = [];
      Object.entries(user.group_subgroup).forEach(([group, groupSubgroups]) => {
        if (Array.isArray(groupSubgroups) && groupSubgroups.length > 0) {
          subgroups.push(...groupSubgroups);
        }
      });
      return subgroups;
    } else if (user.subgroup) {
      return Array.isArray(user.subgroup) ? user.subgroup : [user.subgroup];
    }
    return [];
  };

  const fetchPolicyDetails = async (policyIds) => {
    try {
      const policies = await Promise.all(policyIds.map(async (id) => {
        const response = await fetch(`${import.meta.env.VITE_FAST_API}/listpolicy/${id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        return {
          id,
          name: data.policy?.sub_policy_name || `Policy ${id}`,
          roles: data.policy?.user_selections?.role ? [data.policy.user_selections.role] : [],
          persona: data.policy?.user_selections?.persona || [],
          groups: data.policy?.user_selections?.group ? [data.policy.user_selections.group] : [],
          subgroups: data.policy?.user_selections?.subGroup ? [data.policy.user_selections.subGroup] : []
        };
      }));
      setExistingPolicies(policies);
    } catch (error) {
      console.error("Error fetching policy details:", error);
      setApiResponse({
        status: 'error',
        message: 'Failed to load policy details'
      });
    }
  };

  // useEffect(() => {
  //   if (formData.groups.length > 0) {
  //     fetchSubgroups(formData.groups);
  //   } else {
  //     setDropdownOptions(prev => ({
  //       ...prev,
  //       subgroups: []
  //     }));
  //   }
  // }, [formData.groups]);

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

  const validate = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.datapolicy.length === 0) {
      newErrors.policyAssignment = 'Please select at least one policy';
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
      if (!userData) {
        throw new Error('User data not available');
      }

      const payload = {
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        roles_assigned: formData.roles,
        persona: formData.persona.length === 0 ? [""] : formData.persona,
        group: formData.groups,
        subgroup: formData.subgroups,
        datapolicy: formData.datapolicy
      };

      const response = await fetch(`${import.meta.env.VITE_FAST_API}/auth/users/${userData.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to update user');
      }

      setApiResponse({
        status: 'success',
        message: 'User updated successfully'
      });

      setTimeout(() => {
        onSave();
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

  const handleClose = () => {
    setApiResponse({ status: null, message: '' });
    setIsPolicyStepperOpen(false);
    setExistingPolicies([]);
    setNewPolicies([]);
    onClose();
  };

  if (!isOpen || !userData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-[1000px] p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div>
              <Icon className="h-5 w-5 text-[#8e78b7]" icon={"material-symbols:supervisor-account-outline"} width="24" height="24" />
            </div>
            <h2 className="text-xl font-bold text-[#8e78b7]">Edit user</h2>
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
          <div className="space-y-3">
            <h3 className="text-[#8e78b7] font-medium">User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-black mb-1.5">User name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  disabled
                  className="w-full p-2.5 border border-gray-400 rounded-lg bg-gray-100 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">Username cannot be changed</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
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
            <div className="space-y-3">
              <div className="space-y-4 mt-10">
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

                {/* <p className="mt-2 text-sm text-gray-600">
                  Policies will determine the user's roles, persona, groups, and sub-groups.
                </p> */}

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
                Updating...
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
        initialSelectedPolicyIds={[...existingPolicies.map(policy => policy.id), ...newPolicies.map(policy => policy.id)]}
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

export default EditUser;