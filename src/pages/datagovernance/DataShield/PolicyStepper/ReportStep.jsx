import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { FileText, ChevronDown, Info, Loader, ArrowRight, X, Search, Check } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';

const ReportStep = ({ policyData, isEditMode, initialData, onDataChange, setActiveStep, setStepReportData }) => {
    const { token } = useAuth();

    // Refs for each dropdown to detect outside clicks
    const reportGroupsRef = useRef(null);
    const reportTypesRef = useRef(null);
    const reportNamesRef = useRef(null);

    const [reportGroups, setReportGroups] = useState([]);
    const [reportTypes, setReportTypes] = useState([]);
    const [reportNames, setReportNames] = useState([]);

    const [selectedArtefactType, setSelectedArtefactType] = useState('Reports');
    const [selectedReportGroups, setSelectedReportGroups] = useState([]);
    const [selectedReportTypes, setSelectedReportTypes] = useState([]);
    const [selectedReportNames, setSelectedReportNames] = useState([]);
    const [reportEdit, setReportEdit] = useState(false);

    const isInitialRender = useRef(true);
    const initialGroupsRef = useRef([]);
    const initialTypesRef = useRef([]);

    useEffect(() => {
        if (initialData) {
            setSelectedArtefactType(initialData.artefact_type || 'Reports');
            setSelectedReportGroups(initialData.report_group || []);
            setSelectedReportTypes(initialData.report_type || []);
            setSelectedReportNames(initialData.report_name || []);
            initialGroupsRef.current = initialData.report_group || [];
            initialTypesRef.current = initialData.report_type || [];
            isInitialRender.current = true;
        }
    }, [initialData]);

    const [loading, setLoading] = useState({
        reportGroups: true,
        reportTypes: true,
        reportNames: true
    });

    const [error, setError] = useState({
        reportGroups: null,
        reportTypes: null,
        reportNames: null
    });

    const [dropdownOpen, setDropdownOpen] = useState({
        reportGroups: false,
        reportTypes: false,
        reportNames: false
    });
    const [searchTerm, setSearchTerm] = useState({
        reportGroups: '',
        reportTypes: '',
        reportNames: ''
    });

    // Effect to handle clicks outside of the dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                reportGroupsRef.current && !reportGroupsRef.current.contains(event.target) &&
                reportTypesRef.current && !reportTypesRef.current.contains(event.target) &&
                reportNamesRef.current && !reportNamesRef.current.contains(event.target)
            ) {
                setDropdownOpen({
                    reportGroups: false,
                    reportTypes: false,
                    reportNames: false
                });
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);


    useEffect(() => {
        const fetchReportGroups = async () => {
            if (!token) {
                setLoading(prev => ({ ...prev, reportGroups: false }));
                setError(prev => ({ ...prev, reportGroups: 'Authorization token not available.' }));
                return;
            }
            setLoading(prev => ({ ...prev, reportGroups: true }));
            try {
                const response = await fetch(`${window._env_?.VITE_FAST_API}/report-group`, {
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
                setReportGroups(data.report_group || []);
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
            if (!token) {
                setLoading(prev => ({ ...prev, reportTypes: false }));
                setError(prev => ({ ...prev, reportTypes: 'Authorization token not available.' }));
                return;
            }
            setLoading(prev => ({ ...prev, reportTypes: true }));
            try {
                const response = await fetch(`${window._env_?.VITE_FAST_API}/report-type`, {
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
                setReportTypes(data.report_type || []);
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
            if (!token) {
                setReportNames([]);
                setSelectedReportNames([]);
                setLoading(prev => ({ ...prev, reportNames: false }));
                setError(prev => ({ ...prev, reportNames: 'Authorization token not available.' }));
                return;
            }

            setLoading(prev => ({ ...prev, reportNames: true }));
            setError(prev => ({ ...prev, reportNames: null }));

            const requestBody = {
                artefact_type: ["REPORT"]
            };

            if (selectedReportGroups.length > 0) {
                requestBody.report_group = selectedReportGroups;
            }

            if (selectedReportTypes.length > 0) {
                requestBody.report_type = selectedReportTypes;
            }

            try {
                const response = await fetch(`${window._env_?.VITE_FAST_API}/report-names`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'accept': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch report names and parse error response' }));
                    console.error('API Error Response for report names:', errorData);
                    throw new Error(errorData.detail || `Failed to fetch report names (status: ${response.status})`);
                }

                const data = await response.json();
                setReportNames(data.report_names || []);
            } catch (err) {
                console.error('Error fetching report names:', err);
                setError(prev => ({ ...prev, reportNames: err.message }));
                setReportNames([]);
            } finally {
                setLoading(prev => ({ ...prev, reportNames: false }));
            }
        };

        const groupsChanged = JSON.stringify(selectedReportGroups) !== JSON.stringify(initialGroupsRef.current);
        const typesChanged = JSON.stringify(selectedReportTypes) !== JSON.stringify(initialTypesRef.current);

        if (!isInitialRender.current && (groupsChanged || typesChanged)) {
            setSelectedReportNames([]);
        }

        fetchReportNames();
        isInitialRender.current = false;
    }, [selectedReportGroups, selectedReportTypes, token]);

    useEffect(() => {
        const reportsData = {
            artefact_type: selectedArtefactType,
            ...(selectedReportGroups.length > 0 && { report_group: selectedReportGroups }),
            ...(selectedReportTypes.length > 0 && { report_type: selectedReportTypes }),
            report_name: selectedReportNames
        };

        onDataChange({
            reports: reportsData
        });
    }, [selectedArtefactType, selectedReportGroups, selectedReportTypes, selectedReportNames]);

    const handleNext = () => {

        const reportsData = {
            artefact_type: selectedArtefactType,
            report_group: selectedReportGroups,
            report_type: selectedReportTypes,
            report_name: selectedReportNames,
        };

        onDataChange({ reports: reportsData });
        setStepReportData(reportsData);
        setActiveStep(7);
    };

    const handleSkip = () => {
        const emptyReportsData = {
            artefact_type: '',
            report_group: [],
            report_type: [],
            report_name: [],
        };
        onDataChange({ reports: emptyReportsData });
        setStepReportData(emptyReportsData);
        setActiveStep(7);
    };

    const handleBack = () => {
        setActiveStep(5);
    };

    const toggleDropdown = (dropdown) => {
        setDropdownOpen(prev => ({
            ...Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
            [dropdown]: !prev[dropdown]
        }));
    };

    const handleReportGroupToggle = (group) => {
        setSelectedReportGroups(prev =>
            prev.includes(group)
                ? prev.filter(item => item !== group)
                : [...prev, group]
        );
    };

    const handleReportTypeToggle = (type) => {
        setSelectedReportTypes(prev =>
            prev.includes(type)
                ? prev.filter(item => item !== type)
                : [...prev, type]
        );
    };

    const handleReportNameToggle = (name) => {
        setSelectedReportNames(prev =>
            prev.includes(name)
                ? prev.filter(item => item !== name)
                : [...prev, name]
        );
    };

    const handleSelectAll = (items, selectedItems, setSelectedItems) => {
        const relevantItemValues = items.map(item => typeof item === 'object' ? item.id : item);
        if (selectedItems.length === relevantItemValues.length && relevantItemValues.length > 0) {
            setSelectedItems([]);
        } else {
            setSelectedItems([...relevantItemValues]);
        }
    };

    const isFormValid = selectedArtefactType && selectedReportNames.length > 0;

    // Modified to accept a ref
    const renderMultiSelectDropdown = (label, allItems, selectedItems, onToggleIndividual, loadingState, errorState, dropdownKey, setSelectedItemsCallback, ref) => {
        const currentSearchTerm = searchTerm[dropdownKey];
        const filteredItems = allItems.filter(item =>
            item.toLowerCase().includes(currentSearchTerm.toLowerCase())
        );

        return (
            // Attach the ref here
            <div className="mb-6" ref={ref}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                    {dropdownKey === "reportGroups" && " (Optional)"}
                    {dropdownKey === "reportTypes" && " (Optional)"}
                </label>
                {loadingState ? (
                    <div className="flex items-center text-gray-500">
                        <Loader className="animate-spin h-4 w-4 mr-2" />
                        Loading...
                    </div>
                ) : errorState ? (
                    <div className="text-red-500 text-sm">{errorState}</div>
                ) : (
                    <div className="relative">
                        <div
                            className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-[#8e78b7] focus:border-[#8e78b7] rounded-md cursor-pointer"
                            onClick={() => toggleDropdown(dropdownKey)}
                        >
                            {selectedItems.length > 0
                                ? `${selectedItems.length} selected`
                                : `Select`}
                        </div>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <ChevronDown className="h-4 w-4" />
                        </div>

                        {dropdownOpen[dropdownKey] && (
                            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-300 max-h-60">
                                <div className="p-2 border-b border-gray-200 sticky top-0 bg-white z-20">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Search className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-[#8e78b7] focus:border-[#8e78b7] sm:text-sm"
                                            placeholder={`Search...`}
                                            value={currentSearchTerm}
                                            onChange={(e) => setSearchTerm(prev => ({
                                                ...prev,
                                                [dropdownKey]: e.target.value
                                            }))}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                </div>
                                <div className="overflow-auto max-h-[calc(15rem-5rem)]">
                                    <div
                                        className="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 sticky top-0 bg-white z-10"
                                        onClick={() => handleSelectAll(filteredItems, selectedItems, setSelectedItemsCallback)}
                                    >
                                        <Check
                                            className={`h-4 w-4 mr-2 ${selectedItems.length === filteredItems.length && filteredItems.length > 0 ? 'text-[#8e78b7]' : 'text-transparent border border-gray-300 rounded'}`}
                                        />
                                        Select All ({filteredItems.length})
                                    </div>
                                    {filteredItems.length > 0 ? (
                                        filteredItems.map((item, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
                                                onClick={() => onToggleIndividual(item)}
                                            >
                                                <Check
                                                    className={`h-4 w-4 mr-2 ${selectedItems.includes(item) ? 'text-[#8e78b7]' : 'text-transparent border border-gray-300 rounded'}`}
                                                />
                                                {item}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-3 py-2 text-sm text-gray-500">No Search found for {currentSearchTerm}</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };


    return (
        <Box>
            <div className="flex items-center justify-between mb-4">
                <Typography variant="h6" className="text-lg font-medium">Artefact Configuration</Typography>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800 text-sm">
                    <strong>Optional Step:</strong> Configure artefact access policies if needed, else skip.
                </p>
            </div>

            <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            1. Artefact Type
                        </label>
                        <div className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 bg-gray-50 rounded-md">
                            {selectedArtefactType}
                        </div>
                    </div>

                    {renderMultiSelectDropdown(
                        "3. Report Types",
                        reportTypes,
                        selectedReportTypes,
                        handleReportTypeToggle,
                        loading.reportTypes,
                        error.reportTypes,
                        "reportTypes",
                        setSelectedReportTypes,
                        reportTypesRef // Pass the ref
                    )}
                </Grid>

                <Grid item xs={12} md={6}>
                    {renderMultiSelectDropdown(
                        "2. Report Groups",
                        reportGroups,
                        selectedReportGroups,
                        handleReportGroupToggle,
                        loading.reportGroups,
                        error.reportGroups,
                        "reportGroups",
                        setSelectedReportGroups,
                        reportGroupsRef // Pass the ref
                    )}

                    {renderMultiSelectDropdown(
                        "4. Report Names",
                        reportNames,
                        selectedReportNames,
                        handleReportNameToggle,
                        loading.reportNames,
                        error.reportNames,
                        "reportNames",
                        setSelectedReportNames,
                        reportNamesRef // Pass the ref
                    )}
                </Grid>
            </Grid>

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