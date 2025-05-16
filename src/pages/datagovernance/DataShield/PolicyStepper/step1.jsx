import { useEffect, useState } from "react";
import { Stepper, Step, StepLabel, Button, Box, Typography } from '@mui/material';
import { Plus } from 'lucide-react';
import { useAuth } from "../../../../context/AuthContext";


const Step1 = ({ onDataChange, initialData }) => {
    const [policies, setPolicies] = useState([]);
    const [selectedPolicy, setSelectedPolicy] = useState(initialData.selectedPolicy || '');
    const [description, setDescription] = useState(initialData.description || '');
    const [subPolicyName, setSubPolicyName] = useState(initialData.sub_policy_name || '');
    const [subPolicyDescription, setSubPolicyDescription] = useState(initialData.sub_policy_description || '');
    const [policyDescriptionMap, setPolicyDescriptionMap] = useState({});
    const { token } = useAuth();

    useEffect(() => {
        console.log("initial datat iss ====>",initialData)
        fetchPolicy();
    }, []);

    useEffect(() => {
        const currentData = {
            selectedPolicy,
            description,
            sub_policy_name: subPolicyName,  
            sub_policy_description: subPolicyDescription,
            policy_name: subPolicyName  
        };
        onDataChange(currentData);
    }, [selectedPolicy, description, subPolicyName, subPolicyDescription]);

    const fetchPolicy = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_FAST_API}/policytypes`, {
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

    const handlePolicyChange = (e) => {
        const selected = e.target.value;
        setSelectedPolicy(selected);

        if (selected && policyDescriptionMap[selected]) {
            setDescription(policyDescriptionMap[selected]);
        } else {
            setDescription('');
        }
    };

    return (
        <Box>
            <Typography variant="h6 text-lg font-medium" className="mb-4">Policy type</Typography>

            <div className="mt-1 flex justify-between w-full">
                <h2 className="font-medium text-[#8e78b7] flex items-center mb-3">
                    Policy
                </h2>
                <button
                    className="flex items-center bg-[#8e78b7] text-white px-4 py-1.5 rounded-lg hover:bg-[#7b67a3] focus:outline-none"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add policy
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Policy type</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                        type="text"
                        placeholder="Name"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
                        value={subPolicyName}
                        onChange={(e) => setSubPolicyName(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                        type="text"
                        placeholder="Write here"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
                        value={subPolicyDescription}
                        onChange={(e) => setSubPolicyDescription(e.target.value)}
                    />
                </div>
            </div>
        </Box>
    );
};

export default Step1;