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
  const { token } = useAuth();
  const [existingPolicies, setExistingPolicies] = useState([]);
  const [newPolicies, setNewPolicies] = useState([]);
  const [isFetchingPolicyNames, setIsFetchingPolicyNames] = useState(false);

  const allPolicies = Array.from(
    new Map([...existingPolicies, ...newPolicies].map(policy => [String(policy.id), policy])).values()
  );


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
        fetchPolicyNames(userData.datapolicy);
      }

      setApiResponse({ status: null, message: '' });
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
  const handleRemovePolicy = (policyIdToRemove) => {
  // Remove from both policy arrays
  const updatedExisting = existingPolicies.filter(
    policy => String(policy.id) !== String(policyIdToRemove)
  );
  const updatedNew = newPolicies.filter(
    policy => String(policy.id) !== String(policyIdToRemove)
  );

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
    


    const policies = data.map(policy => {
       

  const toArray = (value) => {
    if (!value || value === "" || value === null) {
      return [];
    }
    if (Array.isArray(value)) {
      return value;
    }
    return [value];
  };
  
  return {
    id: String(policy.id),
    name: policy.policy_name || `Policy ${policy.id}`,
    roles: toArray(policy.role || policy.roles),
    persona: toArray(policy.persona || policy.personas),
    groups: toArray(policy.group || policy.groups),
    subgroups: toArray(policy.subgroup || policy.subGroup || policy.subgroups)
  };
});

    
    setExistingPolicies(prev => {
      const existingMap = new Map(prev.map(p => [String(p.id), p]));
      policies.forEach(p => existingMap.set(String(p.id), p));
      return Array.from(existingMap.values());
    });

    return policies;  
  } catch (error) {
    console.error('Error fetching policy names:', error);
    const fallbackPolicies = policyIds.map(policyId => ({
      id: String(policyId),
      name: `Policy ${policyId}`
    }));
    setExistingPolicies(prev => {
      const existingMap = new Map(prev.map(p => [String(p.id), p]));
      fallbackPolicies.forEach(p => existingMap.set(String(p.id), p));
      return Array.from(existingMap.values());
    });

    return fallbackPolicies;  // ← ADD THIS RETURN
  } finally {
    setIsFetchingPolicyNames(false);
  }
};

  // Fetch policy names when allPolicies changes (from modal selection or new policy creation)
  // useEffect(() => {
  //   if (allPolicies.length > 0) {
  //     const policyIds = allPolicies.map(p => String(p.id));
  //     // Remove duplicates
  //     const uniquePolicyIds = [...new Set(policyIds)];
  //     fetchPolicyNames(uniquePolicyIds);
  //   }
  // }, [allPolicies.length]);

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

  // helper to normalize values to arrays
  const toArray = (value) => {
    if (value === null || value === undefined || value === "") return [];
    if (Array.isArray(value)) return value;
    return [value];
  };

  const newExistingPolicies = policyIds.map((policyId) => {
    const policyName = fetchedPolicies.find(p => p.id === String(policyId))?.name || `Policy ${policyId}`;

    const policyIndividualData = appliedData.policiesData?.[policyId];
    

    // normalize group/subgroup/role keys from modal payload
    const roles = policyIndividualData?.role ?? policyIndividualData?.roles ?? [];
    const persona = policyIndividualData?.persona ?? policyIndividualData?.personas ?? [];
    const groups = policyIndividualData?.group ?? policyIndividualData?.groups ?? [];
    const subgroups = policyIndividualData?.subGroup ?? policyIndividualData?.subgroup ?? policyIndividualData?.subgroups ?? [];
    

    return {
      id: String(policyId),
      name: policyName,
      roles: Array.isArray(roles) ? roles : (roles ? [roles] : []),
      persona: Array.isArray(persona) ? persona : (persona ? [persona] : []),
      groups: Array.isArray(groups) ? groups : (groups ? [groups] : []),
      subgroups: Array.isArray(subgroups) ? subgroups : (subgroups ? [subgroups] : [])
    };
  });

  
  newExistingPolicies.forEach(policy => {
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
        // send empty array if no persona selected (avoid sending [""])
        persona: formData.persona && formData.persona.length > 0 ? formData.persona : [],
        group: formData.groups,
        subgroup: formData.subgroups,
        datapolicy: formData.datapolicy
      };

      
      
      const response = await fetch(`${window._env_?.VITE_FAST_API}/auth/users/${userData.id}`, {
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
      <div className="bg-white rounded-2xl w-[1200px] max-w-[95vw] p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div>
              <Icon className="h-5 w-5 text-[#8e78b7]" icon={"material-symbols:supervisor-account-outline"} width="24" height="24" />
            </div>
            <h2 className="text-xl font-bold text-[#8e78b7]">Edit user</h2>
          </div>
        </div>

        {apiResponse.status && (
          <div className={`mb-6 p-3 rounded-lg text-center ${apiResponse.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {apiResponse.message}
          </div>
        )}

        <div className="grid grid-cols-11 gap-8">
          <div className="col-span-3 space-y-3">
            <h3 className="text-[#8e78b7] font-medium">Login Credentials</h3>
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

          <div className="col-span-4 space-y-3">
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

          <div className="col-span-4 space-y-6">
            <h3 className="text-[#8e78b7] font-medium">Access Policies</h3>
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
                    setIsPolicyStepperOpen(true);
                  }}
                  className="w-full px-4 py-2 border border-gray-400 rounded-lg bg-gray-100 hover:bg-[#8e78b7] hover:text-white transition-colors text-black"
                  type="button"
                >
                  Add new policy
                </button>

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
              <p className="text-sm font-medium text-gray-900 truncate" title={policy.name}>
                {policy.name}
              </p>
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
            className="w-20 px-6 py-2.5 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7a6a9e] transition-colors font-medium flex items-center justify-center"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-20 px-6 py-2.5 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7a6a9e] transition-colors font-medium flex items-center gap-2 flex items-center justify-center"
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

export default EditUser;