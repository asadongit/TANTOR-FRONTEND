import { Stepper, Step, StepLabel, Button, Box, Typography } from '@mui/material';
import successBackground from "../../../../assets/green.png";
import { BadgeCheck } from 'lucide-react';
const Step6 = ({ setIsOpen }) => {
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
                <p className="text-lg text-gray-800">
                    Are you sure you want to save this policy?
                </p>


                <div className="flex justify-start gap-4 mt-5">
                    <button className="px-7 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100">
                        No
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="px-7 py-1.5 text-lg bg-[#8e78b7] text-white rounded-lg hover:bg-[#7a66a3] transition-colors"
                    >
                        Yes
                    </button>
                </div>
            </div>
        </Box>
    )
}

export default Step6;