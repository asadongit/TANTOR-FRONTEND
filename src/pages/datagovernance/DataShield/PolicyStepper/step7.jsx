import { Stepper, Step, StepLabel, Button, Box, Typography } from '@mui/material';
import successBackground from "../../../../assets/green.png";
import { BadgeCheck } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { toast } from "react-hot-toast";

const Step7 = ({ setIsOpen, policyData, setActiveStep, fetchPolicyListData }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { token, decodedToken} = useAuth();
     const [error, setError] = useState(null);


    const handleSavePolicy = async () => {

        setIsSubmitting(true);
        
        const finalPolicyData = {
            ...policyData,
            policy_status: "active", 
            expiry_date: "2026-05-14",
            owner: decodedToken?.preferred_username,
        };

        // setLoading(true);
        setError(null);
    
        try {
         console.log('Final policy data to be saved:', finalPolicyData);

          const response = await fetch(`${import.meta.env.VITE_FAST_API}/addpolicy`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(finalPolicyData),
          });
    
          if (!response.ok) {
            console.log("")
            toast.error("Error Adding Policy")
            setIsOpen(false)
            // const errorData = await response.json().catch(() => ({}));
            // throw new Error(errorData.detail || `Error: ${response.status} ${response.statusText}`);
          }
    
          const data = await response.json();
          console.log("add policy successfully", data);
          toast.success("Policy added successfully")
          await fetchPolicyListData();
          setIsOpen(false)
    
        } catch (error) {
          console.error("Error adding policy:", error);
          setError(error.message || "Failed to add policy. Please try again.");
        } finally {
        //   setLoading(false);
        setIsSubmitting(false);
        }
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
                    <BadgeCheck className="w-8 h-8 text-green-500" />{" "}
                    <h2 className="text-2xl font-bold">Confirmation submission</h2>
                </div>
                
                
                <p className="text-lg text-gray-800 mb-4">
                    Are you sure you want to save this policy?
                </p>

                <div className="flex justify-start gap-4 mt-5">
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
            </div>
        </Box>
    )
}

export default Step7;