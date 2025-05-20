import { useEffect, useMemo, useState } from "react";
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
    BadgeCheck,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { Icon } from "@iconify-icon/react";
import { useNavigate } from "react-router-dom";
import { Stepper, Step, StepLabel, Button, Box, Typography } from '@mui/material';
import Step1 from "./PolicyStepper/step1";
import Step2 from "./PolicyStepper/step2";
import Step3 from "./PolicyStepper/step3";
import Step4 from "./PolicyStepper/step4";
import Step5 from "./PolicyStepper/step5";
import Step6 from "./PolicyStepper/step6";
import Step7 from "./PolicyStepper/step7";
import { useAuth } from "../../../context/AuthContext";

const Toggle = ({ enabled, onToggle }) => {
    return (
        <div
            onClick={onToggle}
            className={`relative inline-flex h-5 w-10 cursor-pointer rounded-full transition-colors ease-in-out duration-200 ${enabled ? "bg-[#1a9962]" : "bg-red-500"}`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ease-in-out duration-200 m-0.5 ${enabled ? "translate-x-5" : "translate-x-0"}`}
            />
        </div>
    );
};

const Policy = () => {
    const { token } = useAuth();
    const [policy, setPolicy] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sampleData, setSampleData] = useState([]);
    const [activeMenu, setActiveMenu] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({
        open: false,
        policyId: null,
        policyName: ''
    });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    useEffect(() => {
        FetchPolicyDashboardData();
        fetchPolicyListData();
    }, []);

    const FetchPolicyDashboardData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_FAST_API}/policycards`, {
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
            const transformedRoles = data?.policy_name_counts.map(policy => ({
                title: policy.policy_type,
                count: policy.count,
                enabled: policy.policy_status || "Disabled",
                icon: "material-symbols:tab-group-outline",
                bgcolor: "bg-[#8d77ba] bg-opacity-25",
                iconcolor: "text-[#8d77ba]",
            }));
            setPolicy(transformedRoles);
        } catch (error) {
            console.error('Error fetching role data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPolicyListData = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_FAST_API}/policylist`, {
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
            const transformedData = data?.policies.map(policy => ({
                id: policy.id,
                Type: policy.policy_type,
                Name: policy.policy_name,
                Description: policy.policy_description,
                Status: policy.policy_status,
                CompletedDate: policy.completed_date,
                expiryDate: policy.expiry_date,
                UpdatedDate: policy.updated_date,
                Owner: policy.owner
            }));
            setSampleData(transformedData);
        } catch (error) {
            console.error('Error fetching role list data:', error);
        }
    };

    const deletePolicy = async (policyId) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_FAST_API}/deletepolicy/${policyId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete policy');
            }

            const data = await response.json();
            console.log(data.message);
            
            // Refresh the policy list after deletion
            fetchPolicyListData();
        } catch (error) {
            console.error('Error deleting policy:', error);
        }
    };

    const handleDeleteClick = (policyId, policyName) => {
        setDeleteConfirm({
            open: true,
            policyId,
            policyName
        });
        setActiveMenu(null);
    };

    const handleDeleteConfirm = async () => {
        if (deleteConfirm.policyId) {
            await deletePolicy(deleteConfirm.policyId);
            setDeleteConfirm({
                open: false,
                policyId: null,
                policyName: ''
            });
        }
    };

    const handleDeleteCancel = () => {
        setDeleteConfirm({
            open: false,
            policyId: null,
            policyName: ''
        });
    };

    const togglePolicy = (index) => {
        const newCards = [...policy];
        newCards[index].enabled = !newCards[index].enabled;
        setPolicy(newCards);
    };

    const navigate = useNavigate();

    const handleClickOutside = () => {
        setActiveMenu(null);
    };

    const [isOpen, setIsOpen] = useState(false);
    const steps = ['Step 1', 'Step 2', 'Step 3', 'Step 4', 'Step 5', 'Step 6', 'Confirmation'];
    const [activeStep, setActiveStep] = useState(0);
    const [policyData, setPolicyData] = useState({
        policy_type: '',
        policy_description: '',
        sub_policy_name: '',
        sub_policy_description: '',
        policy_name: '',
        user_selections: {
            role: '',
            group: [],
            persona: '',
            subGroup: []
        },
        data_connection: []
    });

    const [step1Data, setStep1Data] = useState({
        selectedPolicy: '',
        description: '',
        selectedSubPolicy: '',
        subPolicyDescription: ''
    });

    const [step2Data, setStep2Data] = useState({
        selectedRole: '',
        selectedGroup: '',
        selectedSubgroup: ''
    });

    const [step3Data, setStep3Data] = useState({
        selectedConnections: [],
        selectedSchemas: [],
        selectedTables: [],
        selectedColumns: []
    });

    const handleNext = () => {
        switch (activeStep) {
            case 0:
                updateStep1Data(step1Data);
                break;
            case 1:
                updateStep2Data(step2Data);
                break;
            case 2:
                updateStep3Data(step3Data);
                break;
        }
        if (activeStep < steps.length - 1) {
            setActiveStep(prev => prev + 1);
        }
    };

    const updateStep1Data = (data) => {
        setPolicyData(prev => ({
            ...prev,
            policy_type: data.selectedPolicy,
            policy_description: data.description,
            sub_policy_name: data.sub_policy_name,
            sub_policy_description: data.sub_policy_description,
            policy_name: data.policy_name
        }));
    };

    const updateStep2Data = (data) => {
        const newData = {
            ...policyData,
            user_selections: {
                ...policyData.user_selections,
                role: data.selectedRole,
                group: data.selectedGroup,
                persona: '',
                subGroup: data.selectedSubgroup
            }
        };
        setPolicyData(newData);
    };

    const updateStep3Data = (data) => {
        const connections = processConnectionData(
            data.selectedConnections,
            data.selectedSchemas,
            data.selectedTables,
            data.selectedColumns
        );
        setPolicyData((prev) => ({
            ...prev,
            data_connection: connections,
        }));
    };

    const processConnectionData = (connections, schemas, tables, columns) => {
        const result = [];
        if (!Array.isArray(connections) || !Array.isArray(schemas) || !Array.isArray(tables) || !Array.isArray(columns)) {
            console.warn('Invalid input arrays in processConnectionData');
            return result;
        }

        const connectionGroups = {};
        schemas.forEach((schema) => {
            if (typeof schema !== 'string') return;
            const [conn, schemaName] = schema.split('.');
            if (!conn || !schemaName || !connections.includes(conn)) return;
            if (!connectionGroups[conn]) {
                connectionGroups[conn] = {
                    connection: conn,
                    schemas: {},
                };
            }
            connectionGroups[conn].schemas[schema] = {
                schema: schema,
                tables: new Set(),
                columns: new Set(),
            };
        });

        tables.forEach((table) => {
            if (typeof table !== 'string') return;
            const parts = table.split('.');
            if (parts.length < 3) return;
            const conn = parts[0];
            const schema = parts.slice(0, 2).join('.');
            if (connectionGroups[conn]?.schemas[schema]) {
                connectionGroups[conn].schemas[schema].tables.add(table);
            }
        });

        columns.forEach((column) => {
            if (typeof column !== 'string') return;
            const parts = column.split('.');
            if (parts.length < 4) return;
            const conn = parts[0];
            const schema = parts.slice(0, 2).join('.');
            if (connectionGroups[conn]?.schemas[schema]) {
                connectionGroups[conn].schemas[schema].columns.add(column);
            }
        });

        Object.values(connectionGroups).forEach((connGroup) => {
            Object.values(connGroup.schemas).forEach((schema) => {
                result.push({
                    connection: connGroup.connection,
                    schema: schema.schema,
                    tables: Array.from(schema.tables),
                    columns: Array.from(schema.columns),
                });
            });
        });

        return result;
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const updatePolicyData = (newData) => {
        setPolicyData(prev => ({ ...prev, ...newData }));
    };

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return <Step1 onDataChange={setStep1Data} initialData={step1Data} />;
            case 1:
                return <Step2 onDataChange={setStep2Data} initialData={step2Data} />;
            case 2:
                return <Step3 name='Data' onDataChange={setStep3Data} initialData={step3Data} />;
            case 3:
                return <Step4 policyData={policyData} onDataChange={(data) => setPolicyData(prev => ({ ...prev, ...data }))} />;
            case 4:
                return <Step5 policyData={policyData} onDataChange={updatePolicyData} />;
            case 5:
                return <Step6 policyData={policyData} onDataChange={updatePolicyData} />;
            case 6:
                return <Step7 setIsOpen={setIsOpen} policyData={policyData} setActiveStep={setActiveStep} fetchPolicyListData={fetchPolicyListData} />;
            default:
                return null;
        }
    };

    const setData = () => {
        setPolicyData({
            policy_type: '',
            policy_description: '',
            sub_policy_name: '',
            sub_policy_description: '',
            policy_name: '',
            user_selections: {
                role: '',
                group: [],
                persona: '',
                subGroup: [],
            },
            data_connection: [],
        });
        setStep1Data({
            selectedPolicy: '',
            description: '',
            selectedSubPolicy: '',
            subPolicyDescription: '',
        });
        setStep2Data({
            selectedRole: '',
            selectedGroup: '',
            selectedSubgroup: '',
        });
        setStep3Data({
            selectedConnections: [],
            selectedSchemas: [],
            selectedTables: [],
            selectedColumns: [],
        });
    };

    const handleClear = () => {
        switch (activeStep) {
            case 0:
                setStep1Data({
                    selectedPolicy: '',
                    description: '',
                    selectedSubPolicy: '',
                    subPolicyDescription: '',
                });
                break;
            case 1:
                setStep2Data({
                    selectedRole: '',
                    selectedGroup: '',
                    selectedSubgroup: '',
                });
                break;
            case 2:
                setStep3Data({
                    selectedConnections: [],
                    selectedSchemas: [],
                    selectedTables: [],
                    selectedColumns: [],
                });
                break;
            case 3:
                setPolicyData((prev) => ({
                    ...prev,
                    row_access_control: {},
                }));
                break;
            case 4:
                setPolicyData((prev) => ({
                    ...prev,
                    column_access_control: {},
                }));
                break;
            case 5:
                setPolicyData((prev) => ({
                    ...prev,
                    permissions: {
                        read: false,
                        update: false,
                        write: false,
                        delete: false,
                        execute: false,
                    },
                }));
                break;
            default:
                break;
        }
    };

    // Pagination logic
    const totalPages = Math.ceil(sampleData.length / rowsPerPage);
    const paginatedData = sampleData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Generate pagination buttons with ellipsis
    const maxVisiblePages = 3;
    const pageNumbers = [];
    if (totalPages <= maxVisiblePages) {
        // If total pages are less than or equal to 3, show all pages
        for (let i = 1; i <= totalPages; i++) {
            pageNumbers.push(i);
        }
    } else {
        // Always show the first page
        pageNumbers.push(1);

        // If currentPage is greater than 2, show ellipsis after the first page
        if (currentPage > 2) {
            pageNumbers.push("...");
        }

        // Show the current page and up to 2 pages around it
        const startPage = Math.max(2, currentPage - 1);
        const endPage = Math.min(totalPages - 1, currentPage + 1);

        for (let i = startPage; i <= endPage; i++) {
            if (!pageNumbers.includes(i)) {
                pageNumbers.push(i);
            }
        }

        // If currentPage is less than totalPages - 1, show ellipsis before the last page
        if (currentPage < totalPages - 1) {
            if (!pageNumbers.includes("...")) {
                pageNumbers.push("...");
            }
        }

        // Always show the last page
        if (!pageNumbers.includes(totalPages)) {
            pageNumbers.push(totalPages);
        }
    }

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
                                setIsOpen(true);
                                setActiveStep(0);
                                setData();
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
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8e78b7]"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 max-h-[calc(2*13rem)] overflow-y-auto">
                            {policy.map((card, index) => (
                                <div
                                    key={index}
                                    className="bg-white rounded-lg shadow-sm border border-gray-100"
                                >
                                    <div className="py-4 px-3 h-full flex flex-col justify-between">
                                        <div className="flex items-start justify-between">
                                            <div className="flex gap-1">
                                                <div
                                                    className={`flex items-center justify-center w-9 h-9 rounded-full ${card.bgcolor} ${card.iconcolor} mr-2 shrink-0`}
                                                >
                                                    <Icon icon={card.icon} className="w-5 h-4" />
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
                                                    className={`text-sm ${card.enabled ? "text-[#1a9962]" : "text-red-500"}`}
                                                >
                                                    {card.enabled ? "Enabled" : "Disabled"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-lg shadow mt-5 overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-[#29304a] text-white text-sm">
                                <th className="text-left p-4">Id</th>
                                <th className="text-left p-4">Type</th>
                                <th className="text-left p-4">Name</th>
                                <th className="text-left p-4">Description</th>
                                <th className="text-center p-4">Status</th>
                                <th className="text-left p-4">Created Date</th>
                                <th className="text-left p-4">Expiry Date</th>
                                <th className="text-left p-4">Updated Date</th>
                                <th className="text-left p-4">Owner</th>
                                <th className="text-left p-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan="10" className="p-4 text-center">
                                        <div className="flex justify-center items-center h-20">
                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#8e78b7]"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((policy, index) => (
                                    <tr key={index} className="border-b">
                                        <td className="p-4 text-gray-500">{policy.id}</td>
                                        <td className="p-4 text-gray-500">{policy.Type}</td>
                                        <td className="p-4 text-gray-500">{policy.Name}</td>
                                        <td className="p-4 text-gray-500 max-w-xs truncate">{policy.Description}</td>
                                        <td className="p-4 text-center">
                                            <span
                                                className={`px-5 py-1 rounded text-sm font-normal inline-block ${policy.Status?.toLowerCase() === "active"
                                                    ? "text-green-600 bg-green-200"
                                                    : "text-gray-400 bg-gray-200"}`}
                                            >
                                                {policy.Status || "Active"}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-500 text-center">{policy.CompletedDate || "-"}</td>
                                        <td className="p-4 text-gray-500 text-center">{policy.expiryDate || "-"}</td>
                                        <td className="p-4 text-gray-500 text-center">{policy.UpdatedDate || "-"}</td>
                                        <td className="p-4 text-gray-500">{policy.Owner}</td>
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
                                                        <div
                                                            className="fixed inset-0 z-100"
                                                            onClick={handleClickOutside}
                                                        />
                                                        <div className="absolute top-1 right-8 bg-white rounded-lg shadow-lg border z-20 animate-fadeIn">
                                                            <div className="flex items-center p-1 gap-1">
                                                                <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                                                    <Pencil className="h-4 w-4" />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDeleteClick(policy.id, policy.Name)}
                                                                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                                                >
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
                                ))
                            )}
                            {!loading && paginatedData.length === 0 && (
                                <tr>
                                    <td colSpan="10" className="p-4 text-center text-gray-500">
                                        No Policies found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Pagination Controls */}
                    {!loading && sampleData.length > 0 && (
                        <div className="flex justify-end items-center p-4">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={`p-2 rounded-full ${currentPage === 1 ? "text-gray-400" : "text-gray-700 hover:bg-gray-100"}`}
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            {pageNumbers.map((page, index) => (
                                <div key={index} className="mx-1">
                                    {page === "..." ? (
                                        <span className="text-gray-700">...</span>
                                    ) : (
                                        <button
                                            onClick={() => handlePageChange(page)}
                                            className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium ${
                                                currentPage === page
                                                    ? "bg-[#8e78b7] text-white"
                                                    : "text-gray-700 hover:bg-gray-100"
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className={`p-2 rounded-full ${currentPage === totalPages ? "text-gray-400" : "text-gray-700 hover:bg-gray-100"}`}
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-6 relative">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        {activeStep !== 6 && (
                            <h2 className="text-lg font-bold text-[#8e78b7] flex items-center mb-3">
                                Add Policy
                            </h2>
                        )}
                        {activeStep !== 6 && (
                            <Stepper activeStep={activeStep} alternativeLabel>
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

                        {activeStep !== 6 && (
                            <div className="flex justify-between mt-7">
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleClear}
                                        className="px-5 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        onClick={handleNext}
                                        className="px-6 py-1.5 rounded-md bg-[#8e78b7] text-white hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]"
                                    >
                                        Next
                                    </button>
                                </div>
                                {activeStep !== 0 && (
                                    <button
                                        onClick={handleBack}
                                        className="px-5 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                                    >
                                        Back
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            {deleteConfirm.open && (
                <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Confirm Deletion</h3>
                            <button onClick={handleDeleteCancel} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <p className="mb-6">
                            Are you sure you want to delete the policy "{deleteConfirm.policyName}"?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={handleDeleteCancel}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Policy;