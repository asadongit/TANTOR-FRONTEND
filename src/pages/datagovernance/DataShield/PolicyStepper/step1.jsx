import { Stepper, Step, StepLabel, Button, Box, Typography } from '@mui/material';
import { Plus } from 'lucide-react';
const Step1 = () => {
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
                    >
                        <option value="">Select</option>
                        <option value="data">Data</option>
                        <option value="security">Security</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                        type="text"
                        placeholder="Write here"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
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
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                        type="text"
                        placeholder="Write here"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
                    />
                </div>
            </div>

        </Box>
    )
}

export default Step1