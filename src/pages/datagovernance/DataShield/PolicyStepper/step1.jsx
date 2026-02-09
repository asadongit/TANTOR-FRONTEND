import { useEffect, useState, useRef } from "react";
import { Stepper, Step, StepLabel, Button, Box, Typography, Modal, TextField, CircularProgress, Snackbar, Alert } from '@mui/material';
import { Plus } from 'lucide-react';
import { useAuth } from "../../../../context/AuthContext";

const Step1 = ({ onDataChange, initialData, nextButtonRef, isEditMode = false}) => {
    const [policies, setPolicies] = useState([]);
    const [selectedPolicy, setSelectedPolicy] = useState(initialData.selectedPolicy || '');
    const [description, setDescription] = useState(initialData.description || '');
    const [subPolicies, setSubPolicies] = useState([]);
    const [selectedSubPolicy, setSelectedSubPolicy] = useState(initialData.sub_policy_name || '');
    const [subPolicyDescription, setSubPolicyDescription] = useState(initialData.sub_policy_description || '');
    const [policyName, setPolicyName] = useState(initialData.policy_name || '');
    const [policyDescriptionMap, setPolicyDescriptionMap] = useState({});
    const [modalOpen, setModalOpen] = useState(false);
    const [newSubPolicyName, setNewSubPolicyName] = useState('');
    const [newSubPolicyDesc, setNewSubPolicyDesc] = useState('');
    const [startDate, setStartDate] = useState(initialData.start_date || '');
    const [endDate, setEndDate] = useState(initialData.expiry_date || '');
    const [formValid, setFormValid] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const { token } = useAuth();
    const today = new Date().toISOString().split("T")[0]
    const lastFetchedPolicy = useRef(null);

    useEffect(() => {
        if (token) {
            fetchPolicy();
        }
    }, [token]); // Add token as dependency

    useEffect(() => {
        // Only update if initialData actually changed (avoid resetting on every keystroke)
        if (initialData.selectedPolicy !== selectedPolicy) {
            setSelectedPolicy(initialData.selectedPolicy || '');
        }
        if (initialData.description !== description) {
            setDescription(initialData.description || '');
        }
        if (initialData.sub_policy_name !== selectedSubPolicy) {
            setSelectedSubPolicy(initialData.sub_policy_name || '');
        }
        if (initialData.sub_policy_description !== subPolicyDescription) {
            setSubPolicyDescription(initialData.sub_policy_description || '');
        }
        if (initialData.policy_name !== policyName) {
            setPolicyName(initialData.policy_name || '');
        }
        if (initialData.start_date !== startDate) {
            setStartDate(initialData.start_date || '');
        }
        if (initialData.expiry_date !== endDate) {
            setEndDate(initialData.expiry_date || '');
        }
    }, [initialData]);

    useEffect(() => {
        const currentData = {
            selectedPolicy,
            description,
            sub_policy_name: selectedSubPolicy,
            sub_policy_description: subPolicyDescription,
            policy_name: policyName,
            start_date: startDate,
            expiry_date: endDate,
            isFormValid: selectedPolicy !== '' && selectedSubPolicy !== '' && policyName.trim() !== '',
            checkPolicyName: checkPolicyName
        };
        onDataChange(currentData);

        // Validate form - both policy and subpolicy must be selected
        const isValid =
        selectedPolicy !== '' &&
        selectedSubPolicy !== '' &&
        policyName.trim() !== '';
        setFormValid(isValid);
    }, [selectedPolicy, description, selectedSubPolicy, subPolicyDescription, policyName, startDate, endDate]);

    useEffect(() => {
        if (selectedPolicy && selectedPolicy !== lastFetchedPolicy.current) {
            lastFetchedPolicy.current = selectedPolicy;
            fetchSubPolicies(selectedPolicy);
        } else if (!selectedPolicy) {
            lastFetchedPolicy.current = null;
            setSubPolicies([]);
            setSelectedSubPolicy(''); // Also clear the selected subpolicy
            setSubPolicyDescription(''); // And its description
        }
    }, [selectedPolicy])

    const fetchPolicy = async () => {
        try {
            const response = await fetch(`${window._env_?.VITE_FAST_API}/policytypes`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setPolicies(data.policy_types || []);

            const descriptionMap = {};
            data.policy_types.forEach(policy => {
                descriptionMap[policy.policy_type.trim()] = policy.policy_description;
            });
            setPolicyDescriptionMap(descriptionMap);
        } catch (error) {
            console.error('Error fetching policy types:', error);
        }
    };

    const fetchSubPolicies = async (policyType) => {
        try {
            const encodedPolicyType = encodeURIComponent(policyType);
            const response = await fetch(`${window._env_?.VITE_FAST_API}/subpolicytypes/${encodedPolicyType}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setSubPolicies(data.sub_policy || []);
        } catch (error) {
            console.error('Error fetching sub policy types:', error);
        }
    };

    const handlePolicyChange = (e) => {
        const selected = e.target.value;
        setSelectedPolicy(selected);
        setSelectedSubPolicy('');
        setSubPolicyDescription('');

        if (selected && policyDescriptionMap[selected]) {
            setDescription(policyDescriptionMap[selected]);
        } else {
            setDescription('');
        }
    };

    const handleSubPolicyChange = (e) => {
        const selected = e.target.value;
        setSelectedSubPolicy(selected);

        const subPolicy = subPolicies.find(sp => sp.sub_policy === selected);
        if (subPolicy) {
            setSubPolicyDescription(subPolicy.description);
        } else {
            setSubPolicyDescription('');
        }
    };

    const handleAddSubPolicy = async () => {
        if (!newSubPolicyName || !newSubPolicyDesc) {
            return; // Both fields are required
        }

        setLoading(true);
        try {
            const payload = {
                policy_type: selectedPolicy,
                sub_policy: newSubPolicyName,
                description: newSubPolicyDesc
            };

            const response = await fetch(`${window._env_?.VITE_FAST_API}/addsubpolicy`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Failed to add sub policy');
            }

            // Refresh sub-policies list
            await fetchSubPolicies(selectedPolicy);

            // Close modal and reset form
            setModalOpen(false);
            setNewSubPolicyName('');
            setNewSubPolicyDesc('');

            // Show success toast
            setToast({
                open: true,
                message: 'Subpolicy created successfully!',
                severity: 'success'
            });

        } catch (error) {
            console.error('Error adding sub policy:', error);
            // Show error toast
            setToast({
                open: true,
                message: 'Failed to create subpolicy',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };
    const checkPolicyName = async (isEditMode = false, originalPolicyName = '') => {
        if (!policyName.trim()) {
            return false;
        }

        // Skip validation if editing and name hasn't changed
        if (isEditMode && policyName.trim() === originalPolicyName.trim()) {
            return true;
        }

        try {
            const response = await fetch(`${window._env_?.VITE_FAST_API}/checkpolicyname`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ policy_name: policyName })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.detail || 'Failed to check policy name');
            }

            const data = await response.json();

            if (data.exists) {
                setToast({
                    open: true,
                    message: data.message || 'Policy name already exists',
                    severity: 'error'
                });
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error checking policy name:', error);
            setToast({
                open: true,
                message: error.message || 'Failed to validate policy name',
                severity: 'error'
            });
            return false;
        }
    };

    const handleCloseToast = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setToast({...toast, open: false});
    };

    const handleCancelModal = () => {
        setModalOpen(false);
        setNewSubPolicyName('');
        setNewSubPolicyDesc('');
    };

    return (
        <Box>
            <div className="mt-1 flex justify-between w-full">
                <h2 className="font-medium text-[#8e78b7] flex items-center mb-3">
                    Policy
                </h2>
                <button
                    className={`flex items-center px-4 py-1.5 rounded-lg focus:outline-none ${
                        selectedPolicy ? 'bg-[#8e78b7] text-white hover:bg-[#7b67a3]' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    onClick={() => selectedPolicy && setModalOpen(true)}
                    disabled={!selectedPolicy}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subpolicy
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
                        value={selectedPolicy}
                        onChange={handlePolicyChange}
                    >
                        <option value="">Select Policy Type</option>
                        {policies.map((policy, index) => (
                            <option key={index} value={policy.policy_type.trim()}>
                                {policy.policy_type.trim()}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                        type="text"
                        placeholder="Write here"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
            </div>

            <h2 className="font-medium text-[#8e78b7] flex items-center mt-4">
                Sub Policy
            </h2>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
                        value={selectedSubPolicy}
                        onChange={handleSubPolicyChange}
                        disabled={!selectedPolicy}
                    >
                        <option value="">Select Sub Policy</option>
                        {subPolicies.map((subPolicy, index) => (
                            <option key={index} value={subPolicy.sub_policy}>
                                {subPolicy.sub_policy}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                        type="text"
                        placeholder="Write here"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
                        value={subPolicyDescription}
                        onChange={(e) => setSubPolicyDescription(e.target.value)}
                        readOnly
                    /> 
                </div>
            </div>
            <h2 className="font-medium text-[#8e78b7] flex items-center mt-4">
                Name & Duration
            </h2>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                    </label>
                    <input
                        type="text"
                        placeholder="Enter policy name"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
                        value={policyName}
                        onChange={(e) => setPolicyName(e.target.value)}
                        disabled={!selectedSubPolicy}
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date
                        </label>
                        <input
                            type="date"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            disabled={!selectedSubPolicy}
                            min={today}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Date
                        </label>
                        <input
                            type="date"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            disabled={!selectedSubPolicy}
                            min={startDate}
                        />
                    </div>
                </div>
            </div>
           

            {/* Modal for adding new sub policy */}
            <Modal
                open={modalOpen}
                onClose={() => !loading && handleCancelModal()} 
                aria-labelledby="add-subpolicy-modal"
            >
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg w-96">
                    <h2 className="text-xl font-bold mb-4">Add New Subpolicy</h2>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subpolicy Name</label>
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
                            value={newSubPolicyName}
                            onChange={(e) => setNewSubPolicyName(e.target.value)}
                            placeholder="Enter subpolicy name"
                            disabled={loading}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
                            value={newSubPolicyDesc}
                            onChange={(e) => setNewSubPolicyDesc(e.target.value)}
                            placeholder="Enter description"
                            rows={3}
                            disabled={loading}
                        />
                    </div>

                    <div className="flex justify-end space-x-2">
                        <button
                            onClick={handleCancelModal} 
                            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddSubPolicy}
                            disabled={!newSubPolicyName || !newSubPolicyDesc || loading}
                            className={`px-4 py-2 rounded-lg flex items-center justify-center min-w-[80px] ${
                                newSubPolicyName && newSubPolicyDesc && !loading
                                ? 'bg-[#8e78b7] text-white hover:bg-[#7b67a3]'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            {loading ? <CircularProgress size={20} color="inherit" /> : 'Add'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Toast notification */}
            <Snackbar
                open={toast.open}
                autoHideDuration={6000}
                onClose={handleCloseToast}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseToast} severity={toast.severity} sx={{ width: '100%' }}>
                    {toast.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Step1;