import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Search, FileText, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
 

const MultiSelectDropdown = ({
    title,
    options,
    selected,
    toggleOption,
    hasSelectAll = false,
    disabled = false,
    disabledText = "Select options",
    onOpen,
    isLoading = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleButtonClick = () => {
        if (!isOpen && onOpen) onOpen();
        setIsOpen(!isOpen);
    };

    const buttonText = selected.length > 0
        ? selected.map(val => options.find(opt => opt.value === val)?.label || val).join(', ')
        : `Select ${title}`;

    const tooltipText = selected.length > 0
        ? selected.map(val => options.find(opt => opt.value === val)?.label || val).join(', ')
        : '';

    if (disabled) {
        return (
            <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-2">{title}</label>
                <button
                    disabled
                    className="flex justify-between items-center w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-left cursor-not-allowed"
                >
                    <span className="truncate text-gray-400 text-sm">{disabledText}</span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
            </div>
        );
    }

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-2">{title}</label>
            <button
                type="button"
                onClick={handleButtonClick}
                title={tooltipText}
                className="flex justify-between items-center w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-left hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent transition-colors"
            >
                <span className="truncate text-gray-700 text-sm">{buttonText}</span>
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg">
                    {isLoading ? (
                        <div className="p-4 text-sm text-center text-gray-500">Loading...</div>
                    ) : (
                        <>
                            <div className="p-2 border-b border-gray-200">
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <ul className="py-1 max-h-60 overflow-y-auto">
                                {hasSelectAll && options.length > 0 && (
                                    <li className="px-4 py-2 hover:bg-gray-100">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                onChange={() => toggleOption(filteredOptions.map(opt => opt.value), true)}
                                                checked={filteredOptions.length > 0 && filteredOptions.every(opt => selected.includes(opt.value))}
                                                className="w-4 h-4 text-[#8e78b7] border-gray-300 rounded focus:ring-[#8e78b7]"
                                            />
                                            <span className="text-sm text-gray-700">Select All</span>
                                        </label>
                                    </li>
                                )}

                                {filteredOptions.length === 0 && (
                                    <li className="px-4 py-2 text-sm text-gray-500">No options available</li>
                                )}

                                {filteredOptions.map((option) => (
                                    <li key={option.value} className="px-4 py-2 hover:bg-gray-100">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selected.includes(option.value)}
                                                onChange={() => toggleOption([option.value])}
                                                className="w-4 h-4 text-[#8e78b7] border-gray-300 rounded focus:ring-[#8e78b7]"
                                            />
                                            <span className="text-sm text-gray-700">{option.label}</span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

const GenerateReportPanel = ({ isOpen, onClose, token, onReportGenerated }) => {
    const [formData, setFormData] = useState({
        reportType: '',
        reportName: '',
        dateFrom: '',
        dateTo: '',
        users: [],
        resourceTypes: [],
        operationTypes: []
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [stakeholders, setStakeholders] = useState([]);
    const [isLoadingStakeholders, setIsLoadingStakeholders] = useState(false);
    const [reportTypes, setReportTypes] = useState([]);
    const [isLoadingReportTypes, setIsLoadingReportTypes] = useState(false);

    const resourceTypeOptions = [
        { value: 'USER', label: 'User' },
        { value: 'CLIENT_ROLE_MAPPING', label: 'Client Role Mapping' },
        { value: 'GROUP_MEMBERSHIP', label: 'Group Membership' }
    ];

    const getTodayDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const maxDate = getTodayDate();

    useEffect(() => {
        if (isOpen) {
            fetchReportTypes();
            fetchStakeholders();
        }
    }, [isOpen]);
    const REPORT_PATH = "governance";

    const fetchReportTypes = async () => {
        setIsLoadingReportTypes(true);
        try {
            const response = await fetch(`${window._env_?.VITE_FAST_API}/list_report_type/${REPORT_PATH}`);
            if (!response.ok) throw new Error('Failed to fetch report types');
            const data = await response.json();
            setReportTypes(data);
        } catch (error) {
            console.error('Error fetching report types:', error);
            toast.error('Failed to load report types');
        } finally {
            setIsLoadingReportTypes(false);
        }
    };

    const fetchStakeholders = async () => {
        setIsLoadingStakeholders(true);
        try {
            const response = await fetch(`${window._env_?.VITE_FAST_API}/auth/users/names/stakeholders`);
            if (!response.ok) throw new Error('Network response was not ok for stakeholders');
            const data = await response.json();
            setStakeholders(data);
        } catch (error) {
            console.error('Error fetching stakeholders:', error);
            toast.error('Failed to load users');
        } finally {
            setIsLoadingStakeholders(false);
        }
    };

    useEffect(() => {
        if (!isOpen) {
            setFormData({
                reportType: '',
                reportName: '',
                dateFrom: '',
                dateTo: '',
                users: [],
                resourceTypes: [],
                operationTypes: []
            });
            setErrors({});
        }
    }, [isOpen]);

    useEffect(() => {
        if (formData.reportType === 'Authentication Reporting') {
            setFormData(prev => ({
                ...prev,
                resourceTypes: [],
                operationTypes: []
            }));
        }
    }, [formData.reportType]);

    useEffect(() => {
        const availableOps = getAvailableOperations();
        const availableOpValues = availableOps.map(op => op.value);

        const validOperationTypes = formData.operationTypes.filter(op =>
            availableOpValues.includes(op)
        );

        if (validOperationTypes.length !== formData.operationTypes.length) {
            setFormData(prev => ({
                ...prev,
                operationTypes: validOperationTypes
            }));
        }
    }, [formData.resourceTypes]);

    const getAvailableOperations = () => {
        if (formData.resourceTypes.length === 0) return [];

        const hasUser = formData.resourceTypes.includes('USER');
        const hasClientRole = formData.resourceTypes.includes('CLIENT_ROLE_MAPPING');
        const hasGroupMembership = formData.resourceTypes.includes('GROUP_MEMBERSHIP');

        const operations = [];

        if (hasClientRole || hasGroupMembership) {
            operations.push({ value: 'CREATE', label: 'Create' });
            operations.push({ value: 'DELETE', label: 'Delete' });
        }

        if (hasUser) {
            operations.push({ value: 'UPDATE', label: 'Update' });
        }

        return operations;
    };

    const getUserOptions = () => {
        return stakeholders.map(user => ({
            value: user.id,
            label: user.username
        }));
    };

    const toggleUser = (values, isSelectAll = false) => {
        const userOptions = getUserOptions();
        
        if (isSelectAll) {
            const filteredUserIds = values; 
            const allFilteredSelected = filteredUserIds.every(id => formData.users.includes(id));
            
            if (allFilteredSelected) {
                const newUsers = formData.users.filter(u => !filteredUserIds.includes(u));
                setFormData(prev => ({ ...prev, users: newUsers }));
            } else {
                const newUsers = [...new Set([...formData.users, ...filteredUserIds])];
                setFormData(prev => ({ ...prev, users: newUsers }));
            }
        } else {
            const value = values[0];
            const newUsers = formData.users.includes(value)
                ? formData.users.filter(u => u !== value)
                : [...formData.users, value];
            setFormData(prev => ({ ...prev, users: newUsers }));
        }
    };

    const toggleResourceType = (values, isSelectAll = false) => {
        if (isSelectAll) {
            const newResourceTypes = formData.resourceTypes.length === resourceTypeOptions.length
                ? []
                : values;
            setFormData(prev => ({ ...prev, resourceTypes: newResourceTypes }));
        } else {
            const value = values[0];
            const newResourceTypes = formData.resourceTypes.includes(value)
                ? formData.resourceTypes.filter(rt => rt !== value)
                : [...formData.resourceTypes, value];
            setFormData(prev => ({ ...prev, resourceTypes: newResourceTypes }));
        }
        setErrors(prev => ({ ...prev, resourceTypes: '' }));
    };

    const toggleOperationType = (values, isSelectAll = false) => {
        const availableOps = getAvailableOperations();
        const availableOpValues = availableOps.map(op => op.value);

        if (isSelectAll) {
            const newOperationTypes = formData.operationTypes.length === availableOpValues.length
                ? []
                : availableOpValues;
            setFormData(prev => ({ ...prev, operationTypes: newOperationTypes }));
        } else {
            const value = values[0];
            const newOperationTypes = formData.operationTypes.includes(value)
                ? formData.operationTypes.filter(ot => ot !== value)
                : [...formData.operationTypes, value];
            setFormData(prev => ({ ...prev, operationTypes: newOperationTypes }));
        }
    };

    const handleReportTypeChange = (e) => {
        setFormData(prev => ({
            ...prev,
            reportType: e.target.value
        }));
        setErrors(prev => ({ ...prev, reportType: '' }));
    };

    const handleDateFromChange = (e) => {
        setFormData(prev => ({
            ...prev,
            dateFrom: e.target.value
        }));
        setErrors(prev => ({ ...prev, dateFrom: '', dateTo: '' }));
    };

    const handleDateToChange = (e) => {
        setFormData(prev => ({
            ...prev,
            dateTo: e.target.value
        }));
        setErrors(prev => ({ ...prev, dateTo: '' }));
    };

    const handleReportNameChange = (e) => {
        setFormData(prev => ({
            ...prev,
            reportName: e.target.value
        }));
        setErrors(prev => ({ ...prev, reportName: '' }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.reportType) {
            newErrors.reportType = 'Report Type is required';
        }

        if (!formData.reportName || formData.reportName.trim() === '') {
            newErrors.reportName = 'Report Name is required';
        }

        if (formData.dateFrom && !formData.dateTo) {
            newErrors.dateTo = 'End Date is required';
        }

        if (formData.dateFrom && formData.dateTo) {
            const fromDate = new Date(formData.dateFrom);
            const toDate = new Date(formData.dateTo);
            if (fromDate > toDate) {
                newErrors.dateTo = 'End Date must be after Start Date';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        const loadingMsg = 'Generating report...';
        console.log(loadingMsg);

        try {
            const requestBody = {
                criteria: formData.reportType === 'Authentication Reporting' ? 'authenticationReporting' : 'governanceReporting',
                reportName: formData.reportName.trim()
            };

            const hasFilters = formData.dateFrom || formData.users.length > 0 || formData.resourceTypes.length > 0 || formData.operationTypes.length > 0;

            if (hasFilters) {
                requestBody.filters = {};

                if (formData.dateFrom) {
                    requestBody.filters.date_from = formData.dateFrom;
                }

                if (formData.dateTo) {
                    requestBody.filters.date_to = formData.dateTo;
                }

                if (formData.users.length > 0) {
                    requestBody.filters.user = formData.users.map(userId => {
                        const user = stakeholders.find(s => s.id === userId);
                        return {
                            id: user.id,
                            username: user.username
                        };
                    });
                }

                if (formData.resourceTypes.length > 0) {
                    requestBody.filters.resource_types = formData.resourceTypes;
                }

                if (formData.operationTypes.length > 0) {
                    requestBody.filters.operation_types = formData.operationTypes;
                }
            }

            const response = await fetch(`${window._env_?.VITE_FAST_API}/genReport`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
                const errorMessage = errorData.msg || errorData.detail || `Failed to generate report: ${response.statusText}`;
                throw new Error(errorMessage);
            }

            const data = await response.json();
            toast.success('Report generation started successfully!');

            setFormData({
                reportType: '',
                reportName: '',
                dateFrom: '',
                dateTo: '',
                users: [],
                resourceTypes: [],
                operationTypes: []
            });

            onClose();
            if (onReportGenerated) {
                onReportGenerated();
            }
        } catch (error) {
            console.error('Error generating report:', error);
            toast.error(error.message || 'Failed to generate report. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            reportType: '',
            reportName: '',
            dateFrom: '',
            dateTo: '',
            users: [],
            resourceTypes: [],
            operationTypes: []
        });
        setErrors({});
        onClose();
    };

    if (!isOpen) return null;

    const availableOperations = getAvailableOperations();
    const userOptions = getUserOptions();
    const isAuthenticationReport = formData.reportType === 'Authentication Reporting';

    return (
        <>
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
                onClick={handleCancel}
            />

            <div className="fixed right-0 top-0 h-full w-[500px] bg-white shadow-2xl z-50 transform transition-transform">
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-4 border-b">
                        <div className="flex items-center gap-2">
                            <FileText size={20} className='text-[#8e78b7]' />
                            <h2 className="text-xl font-semibold text-gray-800">Generate Report</h2>
                        </div>
                        <button
                            onClick={handleCancel}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            disabled={isSubmitting}
                        >
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Report Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.reportType}
                                    onChange={handleReportTypeChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8e78b7] focus:border-transparent ${errors.reportType ? 'border-red-500' : 'border-gray-300'}`}
                                    disabled={isSubmitting || isLoadingReportTypes}
                                >
                                    <option value="">Select report type</option>
                                    {reportTypes.map((type) => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                                {errors.reportType && <p className="mt-1 text-xs text-red-500">{errors.reportType}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Report Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.reportName}
                                    onChange={handleReportNameChange}
                                    placeholder="Enter report name"
                                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8e78b7] ${errors.reportName ? 'border-red-500' : 'border-gray-300'} ${!formData.reportType ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                                    disabled={!formData.reportType || isSubmitting}
                                />
                                {errors.reportName && <p className="mt-1 text-xs text-red-500">{errors.reportName}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                                    <input
                                        type="date"
                                        value={formData.dateFrom}
                                        onChange={handleDateFromChange}
                                        max={maxDate}
                                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8e78b7] ${!formData.reportType ? 'bg-gray-50' : ''}`}
                                        disabled={!formData.reportType || isSubmitting}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                                    <input
                                        type="date"
                                        value={formData.dateTo}
                                        onChange={handleDateToChange}
                                        max={maxDate}
                                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8e78b7] ${!formData.reportType ? 'bg-gray-50' : ''}`}
                                        disabled={!formData.reportType || isSubmitting}
                                    />
                                </div>
                            </div>

                            <MultiSelectDropdown
                                title="Users"
                                options={userOptions}
                                selected={formData.users}
                                toggleOption={toggleUser}
                                hasSelectAll={true}
                                disabled={!formData.reportType || isSubmitting}
                                disabledText="Select report type first"
                                isLoading={isLoadingStakeholders}
                            />

                            {!isAuthenticationReport && (
                                <div className="space-y-6 pt-2">
                                    <MultiSelectDropdown
                                        title="Resource Types"
                                        options={resourceTypeOptions}
                                        selected={formData.resourceTypes}
                                        toggleOption={toggleResourceType}
                                        hasSelectAll={true}
                                        disabled={!formData.reportType || isSubmitting}
                                        disabledText="Select report type first"
                                    />

                                    <MultiSelectDropdown
                                        title="Operation Types"
                                        options={availableOperations}
                                        selected={formData.operationTypes}
                                        toggleOption={toggleOperationType}
                                        hasSelectAll={true}
                                        disabled={!formData.reportType || isSubmitting || formData.resourceTypes.length === 0}
                                        disabledText="Select resource types first"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 p-3 border-t bg-gray-50">
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={isSubmitting}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7a67a0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader className="h-5 w-5 animate-spin" />
                                    <span>Generating...</span>
                                </>
                            ) : (
                                <span>Generate</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default GenerateReportPanel;