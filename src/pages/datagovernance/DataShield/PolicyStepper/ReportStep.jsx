import { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { FileText, ChevronDown, Info, Loader } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';

const ReportStep = ({ policyData, onDataChange }) => {
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
            try {
                const response = await fetch(`${import.meta.env.VITE_FAST_API}/report-group`, {
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
                setReportGroups(data.groups?.filter(group => group !== null) || []);
                setError(prev => ({ ...prev, reportGroups: null }));
            } catch (err) {
                console.error('Error fetching report groups:', err);
                setError(prev => ({ ...prev, reportGroups: err.message }));
            } finally {
                setLoading(prev => ({ ...prev, reportGroups: false }));
            }
        };

        fetchReportGroups();
    }, [token]);

    useEffect(() => {
        const fetchReportTypes = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_FAST_API}/report-type`, {
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

        fetchReportTypes();
    }, [token]);

    useEffect(() => {
        const fetchReportNames = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_FAST_API}/report-name`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch report names');
                }

                const data = await response.json();
                setReportNames(data.types || []);
                setError(prev => ({ ...prev, reportNames: null }));
            } catch (err) {
                console.error('Error fetching report names:', err);
                setError(prev => ({ ...prev, reportNames: err.message }));
            } finally {
                setLoading(prev => ({ ...prev, reportNames: false }));
            }
        };

        fetchReportNames();
    }, [token]);

    useEffect(() => {
        onDataChange({
            report_selections: {
                artefact_type: selectedArtefactType,
                report_group: selectedReportGroup,
                report_type: selectedReportType,
                report_name: selectedReportName
            },
            data_connection: [],
            row_access_control: {},
            column_access_control: {}
        });
    }, [selectedArtefactType, selectedReportGroup, selectedReportType, selectedReportName, onDataChange]);

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
            <Typography variant="h6" className="text-lg font-medium mb-4">Report Policy Configuration</Typography>



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
        </Box>
    );
};

export default ReportStep;
