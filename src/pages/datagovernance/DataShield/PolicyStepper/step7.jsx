import { Stepper, Step, StepLabel, Button, Box, Typography } from '@mui/material';
import successBackground from "../../../../assets/green.png";
import { BadgeCheck, Plus, FileText } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { toast } from "react-hot-toast";

const Step7 = ({ setIsOpen, policyData, setActiveStep, fetchPolicyListData, isEditMode, editPolicyId, onPolicyComplete }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { token, decodedToken } = useAuth();
    const [error, setError] = useState(null);

    const handleSavePolicy = async () => {
    setIsSubmitting(true);
    setError(null);

    // Ensure persona is a flat array 
    let personaValue;
    if (Array.isArray(policyData.user_selections.persona)) {
        const flattened = policyData.user_selections.persona.flat().filter(p => p); 
        personaValue = flattened.length > 0 ? flattened : []; 
        personaValue = policyData.user_selections.persona || []; 
    }

    const finalPolicyData = {
        ...policyData,
        user_selections: {
            ...policyData.user_selections,
            persona: personaValue
        },
        policy_status: "active",
        owner: decodedToken?.preferred_username,
    };

    try {
        const url = isEditMode
            ? `${window._env_?.VITE_FAST_API}/editpolicy/${editPolicyId}`
            : `${window._env_?.VITE_FAST_API}/addpolicy`;

        const method = isEditMode ? 'PATCH' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(finalPolicyData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Error response:", errorData);
            const errorMessage = errorData.detail.includes("400: ")
                ? errorData.detail.split("400: ")[1]
                : errorData.detail;

            if (errorMessage.includes("already exists")) {
                toast.error(errorMessage);
                return;
            }
            throw new Error((isEditMode ? "Error editing policy" : "Error adding policy"));
        }

        const data = await response.json();
        toast.success(isEditMode ? "Policy edited successfully" : "Policy added successfully");

        onPolicyComplete({
            roles: policyData.user_selections.role ? [policyData.user_selections.role] : [],
            group: policyData.user_selections.group || [],
            subgroups: policyData.user_selections.subGroup || [],
            persona: personaValue === "" ? [] : (Array.isArray(personaValue) ? personaValue : [personaValue]),
            id: data.id,
            sub_policy_name: policyData.sub_policy_name,
            policy_type: policyData.policy_type,
            datapolicy: [data.id],
            start_date: policyData.start_date,
            expiry_date: policyData.expiry_date
        });

        await fetchPolicyListData();
        setIsOpen(false);
        setActiveStep(0);

    } catch (error) {
        console.error("Error saving policy:", error);
        if (!error.message.includes("already exists")) {
            toast.error("Failed to save policy");
        }
    } finally {
        setIsSubmitting(false);
    }
};

    const handleEditPolicy = () => {
        setActiveStep(6);
    };

    return (
        <Box>
            <div className="relative h-24">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${successBackground})` }}
                >
                </div>
            </div>

            <div>
                <div className="flex items-center space-x-4 mb-4">
                    <BadgeCheck className="w-8 h-8 text-green-500" />
                    <h2 className="text-2xl font-bold">Confirmation submission</h2>
                </div>

                <p className="text-lg text-gray-800 mb-4">
                    Are you sure you want to save this policy?
                </p>

                <div className="flex flex-row justify-between gap-4 mt-5">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="px-7 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                            disabled={isSubmitting}
                        >
                            No
                        </button>
                        <button
                            onClick={handleSavePolicy}
                            className="px-7 py-1.5 text-lg bg-[#8e78b7] text-white rounded-lg hover:bg-[#7a66a3] transition-colors"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : 'Yes, Save Policy'}
                        </button>
                    </div>
                    <button
                        onClick={handleEditPolicy}
                        className="px-7 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 w-fit"
                        disabled={isSubmitting}
                    >
                        Back
                    </button>
                </div>
            </div>
        </Box>
    );
};

export default Step7;