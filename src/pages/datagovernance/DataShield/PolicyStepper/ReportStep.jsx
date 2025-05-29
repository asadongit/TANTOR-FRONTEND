import { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { FileText, ChevronDown, Info, Loader, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';

const ReportStep = ({ policyData, onDataChange, setActiveStep }) => {
    const { token } = useAuth();

    const [artefactTypes, setArtefactTypes] = useState([]);
    const [reportGroups, setReportGroups] = useState([]);
    const [reportTypes, setReportTypes] = useState([]);
    const [reportNames, setReportNames] = useState([]);

    const [selectedArtefactType, setSelectedArtefactType] = useState('');
    const [selectedReportGroup, setSelectedReportGroup] = useState('');
    const [selectedReportType, setSelectedReportType] = useState('');
    const [selectedReportName, setSelectedReportName] = useState('');

    const [loading, setLoading] = useState({
        artefactTypes: true,
        reportGroups: true,
        reportTypes: true,
        reportNames: true
    });

    const [error, setError] = useState({
        artefactTypes: null,
        reportGroups: null,
        reportTypes: null,
        reportNames: null
    });

    useEffect(() => {
        const fetchArtefactTypes = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_FAST_API}/artefact-type`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch artefact types');
                }

                const data = await response.json();
                setArtefactTypes(data.types || []);
                setError(prev => ({ ...prev, artefactTypes: null }));
            } catch (err) {
                console.error('Error fetching artefact types:', err);
                setError(prev => ({ ...prev, artefactTypes: err.message }));
            } finally {
                setLoading(prev => ({ ...prev, artefactTypes: false }));
            }
        };

        fetchArtefactTypes();
    }, [token]);

    useEffect(() => {
        const fetchReportGroups = async () => {
            if (!selectedArtefactType) {
                setReportGroups([]);
                setLoading(prev => ({ ...prev, reportGroups: false }));
                return;
            }

            setLoading(prev => ({ ...prev, reportGroups: true }));
            try {
                const response = await fetch(`${import.meta.env.VITE_FAST_API}/report-group/${selectedArtefactType}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch report groups');
                }

                const data = await response.json();
                setReportGroups(data.report_group?.filter(group => group !== null) || []);
                setError(prev => ({ ...prev, reportGroups: null }));
            } catch (err) {
                console.error('Error fetching report groups:', err);
                setError(prev => ({ ...prev, reportGroups: err.message }));
            } finally {
                setLoading(prev => ({ ...prev, reportGroups: false }));
            }
        };

        // Reset dependent selections when artefact type changes
        setSelectedReportGroup('');
        setSelectedReportType('');
        setSelectedReportName('');

        fetchReportGroups();
    }, [token, selectedArtefactType]);

    useEffect(() => {
        const fetchReportTypes = async () => {
            if (!selectedReportGroup) {
                setReportTypes([]);
                setLoading(prev => ({ ...prev, reportTypes: false }));
                return;
            }

            setLoading(prev => ({ ...prev, reportTypes: true }));
            try {
                const response = await fetch(`${import.meta.env.VITE_FAST_API}/report-type/${selectedReportGroup}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch report types');
                }

                const data = await response.json();
                setReportTypes(data.types || []);
                setError(prev => ({ ...prev, reportTypes: null }));
            } catch (err) {
                console.error('Error fetching report types:', err);
                setError(prev => ({ ...prev, reportTypes: err.message }));
            } finally {
                setLoading(prev => ({ ...prev, reportTypes: false }));
            }
        };

        // Reset dependent selections when report group changes
        setSelectedReportType('');
        setSelectedReportName('');

        fetchReportTypes();
    }, [token, selectedReportGroup]);

    useEffect(() => {
        const fetchReportNames = async () => {
            if (!selectedReportGroup || !selectedReportType) {
                setReportNames([]);
                setLoading(prev => ({ ...prev, reportNames: false }));
                return;
            }

            setLoading(prev => ({ ...prev, reportNames: true }));
            try {
                const response = await fetch(`${import.meta.env.VITE_FAST_API}/report-name`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        report_type: selectedReportType,
                        report_group: selectedReportGroup
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch report names');
                }

                const data = await response.json();
                setReportNames(data.report_names || []);
                setError(prev => ({ ...prev, reportNames: null }));
            } catch (err) {
                console.error('Error fetching report names:', err);
                setError(prev => ({ ...prev, reportNames: err.message }));
            } finally {
                setLoading(prev => ({ ...prev, reportNames: false }));
            }
        };

        // Reset dependent selection when report type changes
        setSelectedReportName('');

        fetchReportNames();
    }, [token, selectedReportGroup, selectedReportType]);

    useEffect(() => {
        onDataChange({
            reports: selectedReportName ? [
                {
                    report_name: selectedReportName,
                    report_type: selectedReportType,
                    report_group: selectedReportGroup,
                    artefact_type: selectedArtefactType
                }
            ] : []

        });
    }, [selectedArtefactType, selectedReportGroup, selectedReportType, selectedReportName, onDataChange]);

    const handleNext = () => {
        setActiveStep(7); // Go to final confirmation
    };

    const handleSkip = () => {
        // Clear any report data and go to confirmation
        onDataChange({
            reports: []
        });
        setActiveStep(7);
    };

    const handleBack = () => {
        setActiveStep(5); // Go back to step 6 (permissions)
    };

    const isFormValid = selectedArtefactType && selectedReportGroup && selectedReportType && selectedReportName;

    const renderDropdown = (label, options, value, onChange, loadingState, errorState) => {
        return (
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                </label>
                {loadingState ? (
                    <div className="flex items-center text-gray-500">
                        <Loader className="animate-spin h-4 w-4 mr-2" />
                        Loading...
                    </div>
                ) : errorState ? (
                    <div className="text-red-500 text-sm">{errorState}</div>
                ) : (
                    <div className="relative max-w-md">
                        <select
                            className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-[#8e78b7] focus:border-[#8e78b7] rounded-md appearance-none"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                        >
                            <option value="">Select {label}</option>
                            {options.map((option, index) => (
                                <option key={index} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <ChevronDown className="h-4 w-4" />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <Box>
            <div className="flex items-center justify-between mb-4">
                <Typography variant="h6" className="text-lg font-medium">Report Policy Configuration</Typography>

            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800 text-sm">
                    <strong>Optional Step:</strong> Configure report access policies if needed. You can skip this step and save your policy, or configure reports and then save.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-6 max-w-2xl mt-2">
                {/* Dropdowns */}
                <div className="space-y-1">
                    {renderDropdown(
                        "Artefact Type",
                        artefactTypes,
                        selectedArtefactType,
                        setSelectedArtefactType,
                        loading.artefactTypes,
                        error.artefactTypes
                    )}

                    {renderDropdown(
                        "Report Group",
                        reportGroups,
                        selectedReportGroup,
                        setSelectedReportGroup,
                        loading.reportGroups,
                        error.reportGroups
                    )}

                    {renderDropdown(
                        "Report Type",
                        reportTypes,
                        selectedReportType,
                        setSelectedReportType,
                        loading.reportTypes,
                        error.reportTypes
                    )}

                    {renderDropdown(
                        "Report Name",
                        reportNames,
                        selectedReportName,
                        setSelectedReportName,
                        loading.reportNames,
                        error.reportNames
                    )}
                </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8 pt-4 border-t border-gray-200">
                <div className="flex gap-3">
                    <button
                        onClick={handleSkip}
                        className="px-6 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                        <X className="w-4 h-4 mr-2" />
                        Skip Reports
                    </button>
                    {isFormValid && (
                        <button
                            onClick={handleNext}
                            className="px-6 py-2 rounded-md bg-[#8e78b7] text-white hover:bg-[#7a66a3] flex items-center"
                        >
                            Continue with Reports
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                    )}
                </div>
                <button
                    onClick={handleBack}
                    className="px-5 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                    Back
                </button>
            </div>
        </Box>
    );
};

export default ReportStep;
