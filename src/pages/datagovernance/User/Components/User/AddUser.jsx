import React, { useState, useEffect, useRef } from 'react';
import { X, Loader, Check, Search, ChevronDown, ChevronUp,Info } from 'lucide-react';
import { Icon } from "@iconify-icon/react";
import { useAuth } from '../../../../../context/AuthContext';
import AssignPolicyModal from './AssignPolicyModal';
import Policy from '../../../DataShield/Policy';

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
  const { token } = useAuth();
  const [existingPolicies, setExistingPolicies] = useState([]);
  const [newPolicies, setNewPolicies] = useState([]);
  const [isFetchingPolicyNames, setIsFetchingPolicyNames] = useState(false);

  const allPolicies = Array.from(
    new Map([...existingPolicies, ...newPolicies].map(policy => {
      const normalizedPolicy = {
        ...policy,
        id: String(policy.id)
      };
      return [normalizedPolicy.id, normalizedPolicy];
    })).values()
  );

 

  useEffect(() => {
    if (isOpen) {
      setApiResponse({ status: null, message: '' });
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

  const handleRemovePolicy = (policyIdToRemove) => {
    console.log("Attempting to remove policy ID:", policyIdToRemove, "Type:", typeof policyIdToRemove);
  console.log("existingPolicies:", existingPolicies);
  console.log("newPolicies:", newPolicies);
  // Remove from both policy arrays
  const updatedExisting = existingPolicies.filter(
    policy => policy.id !== policyIdToRemove
  );
  const updatedNew = newPolicies.filter(
    policy => policy.id !== policyIdToRemove
  );

  console.log("After filtering - updatedExisting:", updatedExisting);
  console.log("After filtering - updatedNew:", updatedNew);

  // Update UI
  setExistingPolicies(updatedExisting);
  setNewPolicies(updatedNew);

  // IMPORTANT: Rebuild formData from remaining policies
  const remainingPolicies = [...updatedExisting, ...updatedNew];
  
  if (remainingPolicies.length === 0) {
    // If no policies left, clear everything
    setFormData(prev => ({
      ...prev,
      roles: [],
      persona: [],
      groups: [],
      subgroups: [],
      datapolicy: []
    }));
  } else {
    // Rebuild from remaining policies
    updateFormDataFromPolicies(remainingPolicies);
  }
};

  const fetchPolicyNames = async (policyIds) => {
    if (!policyIds || policyIds.length === 0) return [];

    setIsFetchingPolicyNames(true);
    try {
      const policyIdsAsNumbers = policyIds.map(id => parseInt(id));

      const response = await fetch(`${window._env_?.VITE_FAST_API}/policy_name`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(policyIdsAsNumbers)
      });

      if (!response.ok) {
        throw new Error('Failed to fetch policy names');
      }

      const data = await response.json();

      const policies = data.map(policy => ({
        id: String(policy.id),
        name: policy.name || `Policy ${policy.id}`,
        policyName: policy.policy_name || '',
        subPolicyName: policy.sub_policy_name || ''
      }));

      return policies;
    } catch (error) {
      console.error('Error fetching policy names:', error);
      const fallbackPolicies = policyIds.map(policyId => ({
        id: String(policyId),
        name: `Policy ${policyId}`
      }));
      return fallbackPolicies;
    } finally {
      setIsFetchingPolicyNames(false);
    }
  };

  const updateFormDataFromPolicies = (policies) => {
    const combinedRoles = new Set();
    const combinedPersonas = new Set();
    const combinedGroups = new Set();
    const combinedSubgroups = new Set();
    const dataPolicyIds = [...new Set(policies.map(policy => policy.id))];

    policies.forEach(policy => {
      const addItemsToSet = (data, set) => {
        if (Array.isArray(data)) {
          data.forEach(item => item && set.add(item));
        } else if (typeof data === 'string' && data) {
          set.add(data);
        }
      };

      addItemsToSet(policy.roles, combinedRoles);
      addItemsToSet(policy.persona, combinedPersonas);
      addItemsToSet(policy.groups, combinedGroups);
      addItemsToSet(policy.subgroups, combinedSubgroups); 
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

  const handleApplyPoliciesFromModal = async (appliedData) => {
  const policyIds = appliedData.datapolicy;
  const fetchedPolicies = await fetchPolicyNames(policyIds);

  // Map each policy with ITS OWN individual data
  const newExistingPolicies = policyIds.map((policyId) => {
  const fetchedPolicy = fetchedPolicies.find(
    p => p.id === String(policyId)
  );
  const policyIndividualData = appliedData.policiesData?.[policyId];
  return {
    id: String(policyId),
    name: fetchedPolicy?.name || `Policy ${policyId}`,
    policyName: fetchedPolicy?.policyName || '',
    subPolicyName: fetchedPolicy?.subPolicyName || '',
    roles: policyIndividualData?.role ? [policyIndividualData.role] : [],
    persona: policyIndividualData?.persona || [],
    groups: policyIndividualData?.group ? [policyIndividualData.group] : [],
    subgroups: policyIndividualData?.subGroup ? [policyIndividualData.subGroup] : []
  };
});


  setExistingPolicies(newExistingPolicies);
  updateFormDataFromPolicies(newExistingPolicies);
  setIsPolicyModalOpen(false);
};

  const handlePolicyComplete = (policyDetails) => {
    const newPolicy = {
      id: String(policyDetails.id),
      name: policyDetails.policy_type || `Policy ${policyDetails.id}`,
      roles: policyDetails.roles || [],
      persona: policyDetails.persona || [],
      groups: policyDetails.group || [],
      subgroups: policyDetails.subgroups || []
    };

    setNewPolicies(prev => [...prev, newPolicy]);
    updateFormDataFromPolicies([...existingPolicies, ...newPolicies, newPolicy]);
    setIsPolicyStepperOpen(false);
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
      const response = await fetch(`${window._env_?.VITE_FAST_API}/auth/signup`, {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-[1200px] max-w-[95vw] p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div>
              <Icon className="h-5 w-5 text-[#8e78b7]" icon={"material-symbols:supervisor-account-outline"} width="24" height="24" />
            </div>
            <h2 className="text-md font-bold text-[#8e78b7]">Add user</h2>
            <div className="relative group">
              <Info className="h-4 w-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" />
              <div className="absolute left-0 mt-2 w-48 bg-gray-900 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-10 whitespace-normal">
                Create a new user account with roles, personas, groups, and access policies.
              </div>
            </div>
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

        <div className="grid grid-cols-9 gap-8">
          <div className="col-span-3 space-y-3">
            <h3 className="text-[#8e78b7] font-medium">Login Credentials</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-black mb-1.5">User name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="User name"
                  className={`w-[320px] h-[44px] p-2.5 border ${errors.username ? 'border-red-500' : 'border-gray-400'} rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]`}
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
                  className={`w-[320px] h-[44px] p-2.5 border ${errors.password ? 'border-red-500' : 'border-gray-400'} rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]`}
                />
                {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
                {/* <p className="mt-1 text-xs text-gray-500">
                  Password must contain at least 8 characters, including uppercase, lowercase,
                  numbers, and special characters.
                </p> */}
              </div>
              <div>
                <label className="block text-sm text-black mb-1.5">Confirm password <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  className={`w-[320px] h-[44px] p-2.5 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-400'} rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]`}
                />
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
              </div>
            </div>
          </div>

          <div className="col-span-3 space-y-3">
            <h3 className="text-[#8e78b7] font-medium">Personal Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-black mb-1.5">First name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First name"
                  className={`w-[320px] h-[44px] p-2.5 border ${errors.firstName ? 'border-red-500' : 'border-gray-400'} rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]`}
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
                  className={`w-[320px] h-[44px] p-2.5 border ${errors.lastName ? 'border-red-500' : 'border-gray-400'} rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]`}
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
                  className={`w-[320px] h-[44px] p-2.5 border ${errors.email ? 'border-red-500' : 'border-gray-400'} rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]`}
                />
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
              </div>
            </div>
          </div>

          <div className="col-span-3 space-y-6">
            <h3 className="text-[#8e78b7] font-medium">Access Policies</h3>
            <div className="space-y-3">
              <div className="flex flex-col gap-11 mt-9">
                <button
                  onClick={() => setIsPolicyModalOpen(true)}
                  className="w-[320px] h-[44px] px-4 py-2 border border-gray-400 rounded-lg bg-gray-100 hover:bg-[#8e78b7] hover:text-white transition-colors text-black"
                  type="button"
                >
                  Select existing policy
                </button>

                
                <button
                  onClick={() => {
                    setIsPolicyStepperOpen(true);
                  }}
                  className="w-[320px] h-[44px] px-4 py-2 border border-gray-400 rounded-lg bg-gray-100 hover:bg-[#8e78b7] hover:text-white transition-colors text-black"
                  type="button"
                >
                  Add new policy
                </button>

                {/* {allPolicies.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm font-medium mb-3 text-gray-700">Assigned Policies:</p>
                    {isFetchingPolicyNames ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader className="h-5 w-5 animate-spin text-[#8e78b7]" />
                        <span className="ml-2 text-sm text-gray-600">Loading policy names...</span>
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                        {allPolicies.map((policy, index) => (
                          <div key={policy.id} className="bg-white p-3 rounded-lg border border-gray-200 hover:border-[#8e78b7] transition-colors">
                            <div className="flex items-start gap-2">
                              <span className="text-sm text-gray-500 flex-shrink-0">{index + 1}.</span>
                              <div className="flex-1 min-w-0">
                                <p
                                  className="text-sm font-medium text-gray-900 truncate"
                                  title={policy.name}
                                >
                                  {policy.name}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )} */}

                {allPolicies.length > 0 && (
  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
    <p className="text-sm font-medium mb-3 text-gray-700">Assigned Policies:</p>
    {isFetchingPolicyNames ? (
      <div className="flex items-center justify-center py-6">
        <Loader className="h-5 w-5 animate-spin text-[#8e78b7]" />
        <span className="ml-2 text-sm text-gray-600">Loading policy names...</span>
      </div>
    ) : (
      <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
        {allPolicies.map((policy, index) => (
          <div 
            key={policy.id} 
            className="bg-white p-3 rounded-lg border border-gray-200 hover:border-[#8e78b7] transition-colors flex items-center justify-between group"
          >
            <div className="flex items-start gap-2 flex-1">
              <span className="text-sm text-gray-500 flex-shrink-0">{index + 1}.</span>
              <div className="flex flex-col min-w-0">
                <p
                  className="text-sm font-semibold text-gray-900 truncate"
                  title={policy.name}
                >
                  {policy.name}
                </p>

                {(policy.policyName || policy.subPolicyName) && (
                  <p
                    className="text-xs text-gray-500 truncate"
                    title={`${policy.policyName} | ${policy.subPolicyName}`}
                  >
                    {policy.policyName}
                    {policy.subPolicyName && ` | ${policy.subPolicyName}`}
                  </p>
                )}
              </div>

            </div>
            
            {/* Remove button - visible on hover */}
            <button
  onClick={() => handleRemovePolicy(policy.id)}
  className="ml-2 text-gray-500 hover:text-red-600 hover:bg-red-100 p-1.5 rounded-md transition-all"
  type="button"
  title="Remove policy"
>
  <X className="h-4 w-4" />
</button>
          </div>
        ))}
      </div>
    )}
  </div>
)}

                {errors.policyAssignment && (
                  <p className="mt-2 text-sm text-red-500">{errors.policyAssignment}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-start gap-4 mt-8">
          <button
            onClick={handleClose}
            className="w-24 px-6 py-2.5 bg-white text-gray-700 border border-gray-400 rounded-lg hover:bg-gray-100 transition-colors font-medium flex items-center justify-center"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-24 px-6 py-2.5 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7a6a9e] transition-colors font-medium flex items-center justify-center"
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
        initialSelectedPolicyIds={[...existingPolicies.map(policy => policy.id), ...newPolicies.map(policy => policy.id)]}
        setNewPolicies={setNewPolicies}
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