import { useState } from "react";
import Breadcrumb from "../../../components/Breadcrumb";
import {
    Trash2,
    MoreHorizontal,
    RotateCw,
    List,
    RefreshCcw,
    Code,
    Plus,
    LinkIcon,
    Search,
    MoreVertical,
    Pencil,
    X,
    User, Group, Users, Shield,
    UserPlus,
    UserRoundCog,
    BadgeCheck
} from "lucide-react";
import { Icon } from "@iconify-icon/react";
import { useNavigate } from "react-router-dom";
import { Stepper, Step, StepLabel, Button, Box, Typography } from '@mui/material';
import Step1 from "./PolicyStepper/step1";
import Step2 from "./PolicyStepper/step2";
import Step3 from "./PolicyStepper/step3";
import Step5 from "./PolicyStepper/step5";
import Step6 from "./PolicyStepper/step6";


const Toggle = ({ enabled, onToggle }) => {
    return (
        <div
            onClick={onToggle}
            className={`relative inline-flex h-5 w-10 cursor-pointer rounded-full transition-colors ease-in-out duration-200 ${enabled ? "bg-[#1a9962]" : "bg-red-500"
                }`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ease-in-out duration-200 m-0.5 ${enabled ? "translate-x-5" : "translate-x-0"
                    }`}
            />
        </div>
    );
};

const Policy = () => {
    const [cards, setCards] = useState
        ([
            {
                title: "Data management",
                count: 7,
                enabled: true,
                icon: "material-symbols:tab-group-outline",
                bgcolor: "bg-[#8d77ba] bg-opacity-25",
                iconcolor: "text-[#8d77ba]"
            },
            {
                title: "Data Quality",
                count: 5,
                enabled: true,
                icon: "material-symbols:tab-group-outline",
                bgcolor: "bg-[#8d77ba] bg-opacity-25",
                iconcolor: "text-[#8d77ba]"
            },
            {
                title: "Data security",
                count: 8,
                enabled: false,
                icon: "material-symbols:tab-group-outline",
                bgcolor: "bg-[#8d77ba] bg-opacity-25",
                iconcolor: "text-[#8d77ba]"
            },
            {
                title: "Compliance",
                count: 8,
                enabled: true,
                icon: "material-symbols:tab-group-outline",
                bgcolor: "bg-[#8d77ba] bg-opacity-25",
                iconcolor: "text-[#8d77ba]"
            },
            {
                title: "Retention & Archival",
                count: 8,
                enabled: true,
                icon: "material-symbols:tab-group-outline",
                bgcolor: "bg-[#8d77ba] bg-opacity-25",
                iconcolor: "text-[#8d77ba]"
            }
        ]);

    const togglePolicy = (index) => {
        const newCards = [...cards];
        newCards[index].enabled = !newCards[index].enabled;
        setCards(newCards);
    };

    const navigate = useNavigate();

    const [sampleData, setSampleData] = useState([
        { id: '1', Type: "Data agent", Name: 'Data access', Description: 'Outline was access data', Status: 'Active', CompletedDate: '26/01/2025', expiryDate: '27/01/2025', UpdatedDate: '27/01/2025', Owner: 'John Doe' },
        { id: '1', Type: "Data agent", Name: 'Data access', Description: 'Outline was access data', Status: 'Draft', CompletedDate: '26/01/2025', expiryDate: '27/01/2025', UpdatedDate: '27/01/2025', Owner: 'John Doe' },
        { id: '1', Type: "Data agent", Name: 'Data access', Description: 'Outline was access data', Status: 'Draft', CompletedDate: '26/01/2025', expiryDate: '27/01/2025', UpdatedDate: '27/01/2025', Owner: 'John Doe' },
        { id: '1', Type: "Data agent", Name: 'Data access', Description: 'Outline was access data', Status: 'Active', CompletedDate: '26/01/2025', expiryDate: '27/01/2025', UpdatedDate: '27/01/2025', Owner: 'John Doe' },
        { id: '1', Type: "Data agent", Name: 'Data access', Description: 'Outline was access data', Status: 'Active', CompletedDate: '26/01/2025', expiryDate: '27/01/2025', UpdatedDate: '27/01/2025', Owner: 'John Doe' },
        { id: '1', Type: "Data agent", Name: 'Data access', Description: 'Outline was access data', Status: 'Active', CompletedDate: '26/01/2025', expiryDate: '27/01/2025', UpdatedDate: '27/01/2025', Owner: 'John Doe' },
        { id: '1', Type: "Data agent", Name: 'Data access', Description: 'Outline was access data', Status: 'Active', CompletedDate: '26/01/2025', expiryDate: '27/01/2025', UpdatedDate: '27/01/2025', Owner: 'John Doe' },
        { id: '1', Type: "Data agent", Name: 'Data access', Description: 'Outline was access data', Status: 'Draft', CompletedDate: '26/01/2025', expiryDate: '27/01/2025', UpdatedDate: '27/01/2025', Owner: 'John Doe' },
    ]);
    const [activeMenu, setActiveMenu] = useState(null);

    const handleClickOutside = () => {
        setActiveMenu(null);
    };

    const [isOpen, setIsOpen] = useState(false);

    const steps = ['Step 1', 'Step 2', 'Step 3', 'Step 4', 'Step 5', 'Step 6', 'Confirmation'];

    const [activeStep, setActiveStep] = useState(0);

    const handleNext = () => {
        if (activeStep < 6) {
            setActiveStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Step1 />
                );

            case 1:
                return (
                    <Step2 />
                );
            case 2:
                return (
                    <Step3 name='Data' />
                );

            case 3:
                return (
                    <Step3 name='Access control - Raw' />
                );

            case 4:
                return (
                    <Step3 name='Access control - Column' />
                );
            case 5:
                return (
                    <Step5 />
                );
            case 6:
                return (
                    <Step6 setIsOpen={setIsOpen} />
                )
            default:
                return
        }
    };
    return (
        <>
            <div>
                <Breadcrumb title="Data Governance" link="/" />
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-semibold">Policy</h1>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Search Policy"
                                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none"
                            />
                        </div>
                        <button
                            type="button"
                            className="text-black border border-gray-300 shadow-lg hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-3 py-2.5 me-2 dark:bg-[#ffffff] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
                        >
                            <List className="h-5 w-5" />
                        </button>
                        <button
                            type="button"
                            className="text-black border border-gray-300 shadow-lg hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-3 py-2.5 me-2 dark:bg-[#ffffff] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
                        >
                            <RefreshCcw className="h-5 w-5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setIsOpen(true)
                                setActiveStep(0)
                            }}
                            className="text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-4 py-2.5 me-2 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
                        >
                            <div className="flex justify-between">
                                <Plus className="h-5 w-5 mr-1" />
                                Add Policy
                            </div>
                        </button>
                    </div>
                </div>

                <div className="mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        {cards.map((card, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-lg shadow-sm border border-gray-100"
                            >
                                <div className="py-4 px-3 h-full flex flex-col justify-between ">
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-1">
                                            <div
                                                className={`flex items-center justify-center w-8 h-8 md:w-9 md:h-9 ${card.bgcolor} rounded-full ${card.iconcolor} mr-2`}
                                            >
                                                <Icon icon={card.icon} />
                                            </div>
                                            <h3 className="text-lg font-semibold">{card.title}</h3>
                                        </div>
                                        <button className="p-1 rounded-lg hover:bg-gray-100">
                                            <MoreVertical className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <div className="flex flex-col justify-between mt-1">
                                        <div className="text-5xl font-semibold text-gray-800 ml-2">
                                            {card.count.toString().padStart(2, "0")}
                                        </div>
                                        <div className="flex items-center gap-2 mt-6">
                                            <Toggle
                                                enabled={card.enabled}
                                                onToggle={() => togglePolicy(index)}
                                            />
                                            <span
                                                className={`text-sm ${card.enabled ? "text-[#1a9962]" : "text-red-500"
                                                    }`}
                                            >
                                                {card.enabled ? "Enabled" : "Disabled"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow mt-5 overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-[#29304a] text-white">
                                <th className="text-left p-4">Id</th>
                                <th className="text-left p-4">Type</th>
                                <th className="text-left p-4">Name</th>
                                <th className="text-left p-4">Description</th>
                                <th className="text-center p-4">Status</th>
                                <th className="text-left p-4">Completed Date</th>
                                <th className="text-left p-4">Expiry Date</th>
                                <th className="text-left p-4">Updated Date</th>
                                <th className="text-left p-4">Owner</th>
                                <th className="text-left p-4">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sampleData.map((user, index) => (
                                <tr key={index} className="border-b">
                                    <td className="p-4 text-gray-500">{user.id}</td>
                                    <td className="p-4 text-gray-500">{user.Type}</td>
                                    <td className="p-4 text-gray-500">{user.Name}</td>
                                    <td className="p-4 text-gray-500">{user.Description}</td>
                                    <td className="p-4 text-center">
                                        <span
                                            className={`px-5 py-1 rounded text-sm font-normal inline-block ${user.Status === "Active"
                                                ? "text-green-600 bg-green-200"
                                                : "text-gray-400 bg-gray-200"
                                                }`}
                                        >
                                            {user.Status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-500 text-center">{user.CompletedDate}</td>
                                    <td className="p-4 text-gray-500 text-center">{user.expiryDate}</td>
                                    <td className="p-4 text-gray-500 text-center">{user.UpdatedDate}</td>
                                    <td className="p-4 text-gray-500">{user.Owner}</td>
                                    <td className="px-6 p-4 text-center">
                                        <div className="relative">
                                            <button
                                                onClick={() => setActiveMenu(activeMenu === index ? null : index)}
                                                className="p-1.5 rounded-full hover:bg-gray-100"
                                            >
                                                <MoreHorizontal className="h-5 w-5" />
                                            </button>

                                            {activeMenu === index && (
                                                <>
                                                    <div className="fixed inset-0 z-100" onClick={handleClickOutside} />
                                                    <div className="absolute top-1 right-8 bg-white rounded-lg shadow-lg border z-20 animate-fadeIn">
                                                        <div className="flex items-center p-1 gap-1">
                                                            <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                                                <Pencil className="h-4 w-4" />
                                                            </button>
                                                            <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                            <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                                                <RotateCw className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-6 relative">
                        <button
                            onClick={() => setIsOpen(false)}
                            className=" absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        {activeStep !== 6 && (
                            <h2 className="text-lg font-bold text-[#8e78b7] flex items-center mb-3">
                                Add Policy
                            </h2>
                        )}
                        {activeStep !== 6 && (
                            <Stepper
                                activeStep={activeStep}
                                alternativeLabel
                            >
                                {steps.map((_, index) => {
                                    const isCompleted = index < activeStep;
                                    const isActive = index === activeStep;

                                    return (
                                        <Step key={index} completed={isCompleted}>
                                            <StepLabel
                                                sx={{
                                                    color: isActive ? '#8e78b7' : 'inherit',
                                                    '.MuiStepIcon-root': {
                                                        color: isCompleted ? 'green' : isActive ? '#8e78b7' : '#cfd8dc',
                                                    },
                                                    '.MuiStepLabel-label': {
                                                        color: isActive ? '#8e78b7' : undefined,
                                                    },
                                                }}
                                            />
                                        </Step>
                                    );
                                })}
                            </Stepper>
                        )}



                        <div className="mt-6">
                            {renderStepContent(activeStep)}
                        </div>

                        {activeStep != 6 && (
                            <div className="flex justify-between mt-7">
                                <div className="flex gap-3">
                                    <button className="px-5 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100">
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleNext}
                                        className="px-6 py-1.5 rounded-md bg-[#8e78b7] text-white hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]">
                                        Next
                                    </button>
                                </div>

                                {activeStep != 0 && (
                                    <button
                                        onClick={handleBack}
                                        className="px-5 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100">
                                        Back
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

        </>
    )
}

export default Policy;