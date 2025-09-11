import React, { useState, useEffect } from 'react';
import { useLocation, useParams, Link, useNavigate } from 'react-router-dom';
import { Pencil, Lightbulb, ChartColumn, Layers, TableOfContents, FileCheck2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, FilePenLine } from 'lucide-react';
import Breadcrumb from '../../../components/Breadcrumb';
import { useAuth } from "../../../context/AuthContext.jsx";
import toast from 'react-hot-toast';
import { fetchConnectionDetails, secureQuery } from './Components/function.js';

const Tab = ({ label, activeTab, setActiveTab }) => (
    <button
        onClick={() => setActiveTab(label)}
        className={`px-4 py-2 text-md font-medium border-b-2 ${activeTab === label
            ? 'border-[#8d77ba] text-[#8d77ba]'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
    >
        {label}
    </button>
);

const InfoPill = ({ label }) => (
    <span className="bg-[#8e78b7] text-white text-xs font-medium me-2 px-3 py-2 rounded-full">
        {label}
    </span>
);

const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
    if (!totalItems || totalPages <= 1) {
        return null;
    }

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="flex justify-between items-center p-2 text-sm text-gray-700 border-t">
            <span>
                Showing <span className="font-semibold">{startItem}</span> to <span className="font-semibold">{endItem}</span> of <span className="font-semibold">{totalItems}</span> Entries
            </span>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-2 py-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Back"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="px-3 py-1 font-medium">
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Next"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
};

function ColumnDetailsPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { columnName } = useParams();
    const { token, decodedToken } = useAuth();
    const { columnDetails } = location.state || {};
    const hostnameV1 = window._env_?.VITE_FAST_API;

    const isUserAuthorized = decodedToken?.resource_access?.darch?.roles?.some(role =>
        ['persona:data steward', 'persona:data owner'].includes(role.toLowerCase())
    );

    const [activeTab, setActiveTab] = useState('Summary');
    const [complianceTags, setComplianceTags] = useState([]);
    const [loadingTags, setLoadingTags] = useState(true);
    const [businessView, setBusinessView] = useState('Composite view');
    const [businessData, setBusinessData] = useState({ composite: [], schema: {} });
    const [loadingBusinessData, setLoadingBusinessData] = useState(true);
    const [sampleData, setSampleData] = useState([]);
    const [loadingSampleData, setLoadingSampleData] = useState(false);
    const [sampleDataError, setSampleDataError] = useState(null);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [description, setDescription] = useState('');
    const [originalDescription, setOriginalDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [accessData, setAccessData] = useState([]);
    const [loadingAccessData, setLoadingAccessData] = useState(false);
    const [accessDataError, setAccessDataError] = useState(null);
    const [expandedRows, setExpandedRows] = useState({});
    const [loading, setLoading] = useState(true);
    const [itemsPerPage] = useState(8);
    const [accessCurrentPage, setAccessCurrentPage] = useState(1);
    const [businessCurrentPage, setBusinessCurrentPage] = useState(1);
    const [sampleDataCurrentPage, setSampleDataCurrentPage] = useState(1);

    const getConstraints = (details) => {
        if (!details || !details.column_name || !details.column_metadata) {
            return 'N/A';
        }

        const { column_metadata, constraint_json, column_name } = details;
        const constraintSet = new Set();
        const constraintTypeMap = {
            'P': 'PRIMARY KEY',
            'U': 'UNIQUE',
            'C': 'CHECK',
            'R': 'FOREIGN KEY'
        };

        if (column_metadata.is_nullable === 'N' || column_metadata.is_nullable === 'NO') {
            constraintSet.add('NOT NULL');
        }
        if (constraint_json && Array.isArray(constraint_json)) {
            constraint_json
                .filter(c =>
                    c.column_name &&
                    typeof c.column_name === 'string' &&
                    c.column_name.trim().toLowerCase() === column_name.trim().toLowerCase()
                )
                .forEach(constraint => {
                    const type = constraint.constraint_type;
                    if (type && typeof type === 'string') {
                        const trimmedType = type.trim();
                        const fullTypeName = constraintTypeMap[trimmedType.toUpperCase()] || trimmedType;
                        constraintSet.add(fullTypeName);
                    }
                });
        }
        if (column_metadata.COLUMN_KEY && typeof column_metadata.COLUMN_KEY === 'string') {
            if (column_metadata.COLUMN_KEY.toUpperCase().includes('PRI')) {
                constraintSet.add('PRIMARY KEY');
            }
        }

        const allConstraints = Array.from(constraintSet);
        return allConstraints.length > 0 ? allConstraints.join(', ') : '-';
    };

    const fetchColumnData = async () => {
        if (!columnDetails) return;
        try {
            setLoading(true);
            const secureQueryResponse = await secureQuery({ user_query: "" }, token);
            const policyIds = secureQueryResponse.matched_policy_ids || [];
            const allConnectionsData = await fetchConnectionDetails(policyIds, token);

            const currentTableData = allConnectionsData.find(
                item => item.connection_name === columnDetails.connection_name &&
                    item.table_schema === columnDetails.table_schema &&
                    item.table_name === columnDetails.table_name
            );

            if (currentTableData) {
                const columnTagInfo = currentTableData.tags_column_json?.find(
                    tag => tag.column_name === columnDetails.column_name
                );
                const foundDescription = columnTagInfo?.column_description?.[0] || 'Column Description';
                setDescription(foundDescription);
                setOriginalDescription(foundDescription);
            }
        } catch (error) {
            console.error('Error fetching column data:', error);
            toast.error('Failed to load column data');
        } finally {
            setLoading(false);
        }
    };

    const refetchColumnData = async () => {
        if (!columnDetails) return;
        try {
            const secureQueryResponse = await secureQuery({ user_query: "" }, token);
            const policyIds = secureQueryResponse.matched_policy_ids || [];
            const allConnectionsData = await fetchConnectionDetails(policyIds, token);

            const currentTableData = allConnectionsData.find(
                item => item.connection_name === columnDetails.connection_name &&
                    item.table_schema === columnDetails.table_schema &&
                    item.table_name === columnDetails.table_name
            );

            if (currentTableData) {
                const columnTagInfo = currentTableData.tags_column_json?.find(
                    tag => tag.column_name === columnDetails.column_name
                );
                const foundDescription = columnTagInfo?.column_description?.[0] || 'Column Description';
                setDescription(foundDescription);
                setOriginalDescription(foundDescription);
            }
        } catch (error) {
            console.error('Error refetching column data:', error);
            toast.error('Failed to refresh column data');
        }
    };

    useEffect(() => {
        fetchColumnData();
    }, [columnDetails, token]);

    useEffect(() => {
        if (!columnDetails) return;

        const fetchComplianceTags = async () => {
            setLoadingTags(true);
            try {
                const response = await fetch(`${hostnameV1}/data_catalogue/compliance_tags`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        connection_set: [{
                            connection_name: columnDetails.connection_name,
                            table_schema: columnDetails.table_schema,
                            table_name: columnDetails.table_name,
                            column: columnDetails.column_name
                        }]
                    })
                });

                if (!response.ok) throw new Error('Failed to fetch compliance tags');
                const data = await response.json();
                setComplianceTags(data.sub_tags?.map(tag => tag.name) || []);
            } catch (error) {
                console.error('Error fetching compliance tags:', error);
                setComplianceTags([]);
            } finally {
                setLoadingTags(false);
            }
        };

        fetchComplianceTags();
    }, [columnDetails, token]);

    useEffect(() => {
        if (activeTab !== 'Business' || !columnDetails) return;

        const fetchBusinessData = async () => {
            setLoadingBusinessData(true);
            setBusinessCurrentPage(1);
            try {
                const response = await fetch(`${hostnameV1}/data_catalogue/business_tab`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'accept': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        connection_set: [{
                            connection_name: columnDetails.connection_name,
                            table_schema: columnDetails.table_schema,
                            table_name: columnDetails.table_name,
                            column: columnDetails.column_name
                        }],
                    }),
                });

                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                const columnBusinessInfo = Object.values(data)[0];

                if (!columnBusinessInfo) throw new Error("Business data format from API is incorrect.");

                const tags = {
                    domain: columnBusinessInfo.domain || [],
                    category: columnBusinessInfo.category || [],
                    subCategory: columnBusinessInfo.sub_category || [],
                    term: columnBusinessInfo.term || [],
                    tag: columnBusinessInfo.tag || [],
                    subTag: columnBusinessInfo.sub_tag || [],
                };
                const schemaForState = {
                    domain: tags.domain?.map(t => t.name) || [],
                    category: tags.category?.map(t => t.name) || [],
                    subCategory: tags.subCategory?.map(t => t.name) || [],
                    term: tags.term?.map(t => t.name) || [],
                    tag: tags.tag?.map(t => t.name) || [],
                    subTag: tags.subTag?.map(t => t.name) || [],
                };
                const newCompositeState = [];
                const maxLength = Math.max(...Object.values(schemaForState).map(arr => arr.length));

                if (maxLength === 0) {
                    newCompositeState.push({
                        id: '01', column: columnDetails.column_name, domain: 'N/A', category: 'N/A',
                        subCategory: 'N/A', term: 'N/A', tag: 'N/A', subTag: 'N/A',
                    });
                } else {
                    for (let i = 0; i < maxLength; i++) {
                        newCompositeState.push({
                            id: (i + 1).toString().padStart(2, '0'),
                            column: columnDetails.column_name,
                            domain: schemaForState.domain[i] || '-',
                            category: schemaForState.category[i] || '-',
                            subCategory: schemaForState.subCategory[i] || '-',
                            term: schemaForState.term[i] || '-',
                            tag: schemaForState.tag[i] || '-',
                            subTag: schemaForState.subTag[i] || '-',
                        });
                    }
                }
                setBusinessData({ schema: schemaForState, composite: newCompositeState });
            } catch (error) {
                console.error('Error fetching business data:', error);
                setBusinessData({ composite: [], schema: {} });
            } finally {
                setLoadingBusinessData(false);
            }
        };

        fetchBusinessData();
    }, [activeTab, columnDetails, token]);

    useEffect(() => {
        if (activeTab !== 'Sample data' || !columnDetails) return;

        const fetchSampleData = async () => {
            setLoadingSampleData(true);
            setSampleDataError(null);
            setSampleData([]);
            setSampleDataCurrentPage(1);
            try {
                const response = await fetch(`${hostnameV1}/data_catalogue/columns/sample_data`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'accept': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        connection_name: columnDetails.connection_name,
                        table_schema: columnDetails.table_schema,
                        table_name: columnDetails.table_name
                    })
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch sample data. Status: ${response.status}`);
                }
                const dataText = await response.text();
                if (!dataText.trim()) {
                    setSampleData([]);
                    setLoadingSampleData(false);
                    return;
                }

                const allRows = dataText
                    .trim()
                    .split('\n')
                    .filter(row => row.trim() !== '')
                    .map(row => JSON.parse(row));

                const targetColumnName = columnDetails.column_name;

                const columnSpecificData = allRows.map(row => ({
                    [targetColumnName]: row[targetColumnName] !== undefined ? row[targetColumnName] : null
                }));

                setSampleData(columnSpecificData);
            } catch (error) {
                console.error("Error fetching sample data:", error);
                setSampleDataError("Failed to fetch sample data.");
            } finally {
                setLoadingSampleData(false);
            }
        };

        fetchSampleData();
    }, [activeTab, columnDetails, token]);

    useEffect(() => {
        if (activeTab !== 'Access' || !columnDetails) return;

        const fetchAccessData = async () => {
            setLoadingAccessData(true);
            setAccessDataError(null);
            setAccessData([]);
            setExpandedRows({});
            setAccessCurrentPage(1);

            try {
                const response = await fetch(`${hostnameV1}/data_catalogue/access_tab`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'accept': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        connection_set: [{
                            connection_name: columnDetails.connection_name,
                            table_schema: columnDetails.table_schema,
                            table_name: columnDetails.table_name,
                            column: columnDetails.column_name
                        }]
                    })
                });

                if (!response.ok) throw new Error(`Failed to fetch access data. Status: ${response.status}`);
                const data = await response.json();
                const processedData = [];
                if (data.role) {
                    for (const [name, users] of Object.entries(data.role)) {
                        processedData.push({ type: 'Role', name, users: users || [] });
                    }
                }
                if (data.group) {
                    for (const [name, users] of Object.entries(data.group)) {
                        processedData.push({ type: 'Group', name, users: users || [] });
                    }
                }
                if (data.subgroup) {
                    for (const [name, users] of Object.entries(data.subgroup)) {
                        processedData.push({ type: 'Sub-group', name, users: users || [] });
                    }
                }
                setAccessData(processedData);
            } catch (error) {
                console.error("Error fetching access data:", error);
                setAccessDataError("Failed to load access information.");
            } finally {
                setLoadingAccessData(false);
            }
        };

        fetchAccessData();
    }, [activeTab, columnDetails, token]);

    const handleCancelEdit = () => {
        setIsEditingDescription(false);
        setDescription(originalDescription);
    };

    const handleSaveDescription = async () => {
        if (!columnDetails) {
            toast.error("Column data is not available.");
            return;
        }
        if (description.trim() === '') {
            toast.error("Description cannot be empty.");
            return;
        }
        const trimmedDescription = description.trim();

        setIsSaving(true);
        setIsEditingDescription(false);
        try {
            const payload = {
                connection_name: columnDetails.connection_name,
                table_schema: columnDetails.table_schema,
                table_name: columnDetails.table_name,
                column_name: columnDetails.column_name,
                column_description: trimmedDescription,
                roles: decodedToken?.resource_access?.darch?.roles || [],
                owner: decodedToken?.preferred_username
            };

            const response = await fetch(`${hostnameV1}/data_catalogue/edit_column_description`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                await refetchColumnData();
                throw new Error(errorData.detail || 'Failed to save description.');
            }

            const successData = await response.json();
            toast.success(successData.message || "Description updated successfully!");
            await refetchColumnData();
        } catch (error) {
            console.error("Error saving description:", error);
            toast.error(error.message || "Failed to update column description.");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleRow = (name) => {
        setExpandedRows(prev => ({ ...prev, [name]: !prev[name] }));
    };

    const indexOfLastAccessItem = accessCurrentPage * itemsPerPage;
    const indexOfFirstAccessItem = indexOfLastAccessItem - itemsPerPage;
    const currentAccessItems = accessData.slice(indexOfFirstAccessItem, indexOfLastAccessItem);
    const totalAccessPages = Math.ceil(accessData.length / itemsPerPage);
    const handleAccessPageChange = (page) => setAccessCurrentPage(page);

    const indexOfLastSampleDataItem = sampleDataCurrentPage * itemsPerPage;
    const indexOfFirstSampleDataItem = indexOfLastSampleDataItem - itemsPerPage;
    const currentSampleDataItems = sampleData.slice(indexOfFirstSampleDataItem, indexOfLastSampleDataItem);
    const totalSampleDataPages = Math.ceil(sampleData.length / itemsPerPage);
    const handleSampleDataPageChange = (page) => setSampleDataCurrentPage(page);

    if (!columnDetails) {
        return (
            <div className="p-4">
                Column data not found. Please navigate from the columns list.
                <Link to="/datagovernance/data-catalogue/column" className="text-blue-600"> Go back</Link>
            </div>
        );
    }

    const tabs = ["Summary", "Sample data", "Access", "Business"];

    const formatTitle = (title) => {
        const spacedTitle = title.replace(/([A-Z])/g, ' $1');
        const capitalized = spacedTitle.charAt(0).toUpperCase() + spacedTitle.slice(1);
        return capitalized.replace('Sub Category', 'Sub-category').replace('Sub Tag', 'Sub-tag');
    };

    const sampleDataHeaders = sampleData.length > 0 ? Object.keys(sampleData[0]) : [];

    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            <Breadcrumb />
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                        <div className="text-lg text-gray-500">Loading...</div>
                    </div>
                </div>
            ) : (
                <div className="mt-2 flex flex-col xl:flex-row gap-8">
                    <div className="flex-grow bg-white px-6 pt-6 pb-10 rounded-lg shadow-sm min-w-0">
                        <div className="flex items-start gap-4 w-full">
                            <div className="flex justify-between w-full">
                                <div className="flex items-center gap-2">
                                    <button title="Back" onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200">
                                        <ChevronLeft className="h-6 w-6" />
                                    </button>
                                    <ChartColumn size={24} className="text-[#8d77ba]" />
                                    <h1 className="text-xl font-bold text-gray-800">{columnDetails?.column_name}</h1>
                                </div>
                            </div>
                        </div>

                        <div className="border-b border-gray-200 mt-4">
                            <nav className="-mb-px flex space-x-10 text-md overflow-x-auto">
                                {tabs.map(tab => (
                                    <Tab key={tab} label={tab} activeTab={activeTab} setActiveTab={setActiveTab} />
                                ))}
                            </nav>
                        </div>

                        <div className="mt-5">
                            {activeTab === 'Summary' && (
                                <div className="space-y-4">
                                    {/* Description Section */}
                                    <div>
                                        <div className='flex items-center justify-between mb-2'>
                                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                                <FilePenLine className="h-5 w-5 text-[#8d77ba]" /> Description
                                            </h3>
                                            {isUserAuthorized && !isEditingDescription && (
                                                <button
                                                    onClick={() => setIsEditingDescription(true)}
                                                    className="p-1 rounded-full hover:bg-gray-100 text-gray-500 [#8d77ba] transition-colors"
                                                    title="Edit Column Description"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                            )}
                                        </div>
                                        {isEditingDescription ? (
                                            <div>
                                                <textarea
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-200 focus:border-[#8d77ba] transition"
                                                    rows="4"
                                                    placeholder="Enter column description..."
                                                />
                                                <div className="flex justify-end gap-2 mt-2">
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleSaveDescription}
                                                        disabled={isSaving}
                                                        className="px-4 py-1.5 text-sm font-medium text-white bg-[#8d77ba] rounded-md hover:bg-[#7a68a5] disabled:bg-purple-300 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        {isSaving ? 'Saving...' : 'Save'}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : isSaving ? (
                                            <div className="text-gray-600 pl-7 min-h-[2rem]">
                                                Saving description...
                                            </div>
                                        ) : (
                                            <div className="text-gray-600 pl-7 min-h-[2rem]">
                                                {description}
                                            </div>
                                        )}
                                    </div>

                                    {/* Compliance Section */}
                                    <div>
                                        <div className='flex items-center gap-2 mb-3'>
                                            <FileCheck2 className="h-5 w-5 text-[#8d77ba]" />
                                            <h3 className="text-lg font-semibold text-gray-800">Compliance</h3>
                                        </div>
                                        <div className="pl-7">
                                            {loadingTags ? (
                                                <InfoPill label="Loading..." />
                                            ) : complianceTags.length > 0 ? (
                                                complianceTags.map((tag, index) => (
                                                    <InfoPill key={index} label={tag} />
                                                ))
                                            ) : (
                                                <InfoPill label="N/A" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Technical Details Section */}
                                    <div>
                                        <div className="overflow-x-auto rounded-lg shadow border mt-8">
                                            <table className="min-w-full">
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    <tr>
                                                        <td className="px-4 py-3 w-1/3 text-sm font-medium text-gray-500">Data Type</td>
                                                        <td className="px-4 py-3 text-sm text-gray-900">{columnDetails.column_metadata.DATA_TYPE}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="px-4 py-3 w-1/3 text-sm font-medium text-gray-500">Nullable</td>
                                                        <td className="px-4 py-3 text-sm text-gray-900">{columnDetails.column_metadata.is_nullable === 'Y' ? 'Yes' : 'No'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="px-4 py-3 w-1/3 text-sm font-medium text-gray-500">Data Length</td>
                                                        <td className="px-4 py-3 text-sm text-gray-900">{columnDetails.column_metadata.DATA_LENGTH}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="px-4 py-3 w-1/3 text-sm font-medium text-gray-500">Data Scale</td>
                                                        <td className="px-4 py-3 text-sm text-gray-900">{columnDetails.column_metadata.DATA_SCALE}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="px-4 py-3 w-1/3 text-sm font-medium text-gray-500">Data Precision</td>
                                                        <td className="px-4 py-3 text-sm text-gray-900">{columnDetails.column_metadata.DATA_PRECISION}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="px-4 py-3 w-1/3 text-sm font-medium text-gray-500">Constraints</td>
                                                        <td className="px-4 py-3 text-sm text-gray-900">{getConstraints(columnDetails)}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'Business' && (
                                <div>
                                    <div className="flex items-center space-x-2 mb-6">
                                        <button
                                            onClick={() => setBusinessView('Composite view')}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${businessView === 'Composite view'
                                                ? 'bg-purple-100 text-[#8d77ba]'
                                                : 'text-gray-600 hover:bg-gray-100'
                                                }`}
                                        >
                                            <Layers className="h-4 w-4" />
                                            Composite view
                                        </button>
                                        <button
                                            onClick={() => setBusinessView('Table Detail View')}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${businessView === 'Table Detail View'
                                                ? 'bg-purple-100 text-[#8d77ba]'
                                                : 'text-gray-600 hover:bg-gray-100'
                                                }`}
                                        >
                                            <TableOfContents className="h-4 w-4" />
                                            Table Detail View
                                        </button>
                                    </div>

                                    {loadingBusinessData ? (
                                        <div className="text-center p-10">Loading business data...</div>
                                    ) : businessView === 'Table Detail View' ? (
                                        <>
                                            {Object.values(businessData.schema).some(arr => arr.length > 0) ? (
                                                <div className="overflow-x-auto rounded-lg shadow border">
                                                    <table className="min-w-full">
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {Object.entries(businessData.schema).map(([type, values]) => (
                                                                <tr key={type} className="hover:bg-gray-50">
                                                                    <td className="px-6 py-4 w-1/3 text-sm font-medium text-gray-500">{formatTitle(type)}</td>
                                                                    <td className="px-6 py-4 text-sm text-gray-900">
                                                                        {(() => {
                                                                            if (!values || values.length === 0) {
                                                                                return <span className="text-gray-500">N/A</span>;
                                                                            }
                                                                            const fullText = values.join(', ');
                                                                            if (values.length > 6 || fullText.length > 200) {
                                                                                const truncatedText = values.slice(0, 3).join(', ');
                                                                                return <span title={fullText}>{`${truncatedText}...`}</span>;
                                                                            }
                                                                            return fullText;
                                                                        })()}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="text-center py-10 px-4 text-sm text-gray-500">
                                                    No business data available for this column.
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="p-1">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                                {Object.keys(businessData.schema).length > 0 ?
                                                    Object.entries(businessData.schema).map(([title, pills]) => (
                                                        <div key={title}>
                                                            <h3 className="text-base font-semibold text-gray-700 mb-3 capitalize">{formatTitle(title)}</h3>
                                                            <div className="flex flex-wrap gap-2">
                                                                {pills.length > 0 ? (
                                                                    pills.map(item => <InfoPill key={item} label={item} />)
                                                                ) : (
                                                                    <InfoPill label="N/A" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    )) : <p className="text-gray-500">No business data available.</p>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'Sample data' && (
                                <div>
                                    {loadingSampleData && <p className="text-gray-500">Loading sample data...</p>}
                                    {sampleDataError && <p className="text-red-600">Error: {sampleDataError}</p>}
                                    {!loadingSampleData && !sampleDataError && sampleData.length === 0 && (
                                        <p className="text-gray-500">No sample data is available for this column.</p>
                                    )}
                                    {!loadingSampleData && !sampleDataError && sampleData.length > 0 && (
                                        <div className="overflow-hidden mt-2 rounded-lg shadow border">
                                            <table className="min-w-full">
                                                <thead>
                                                    <tr className="bg-[#29304a] text-white">
                                                        {sampleDataHeaders.map(header => (
                                                            <th key={header} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">
                                                                {header.replace(/_/g, ' ')}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {currentSampleDataItems.map((row, rowIndex) => (
                                                        <tr key={rowIndex} className="hover:bg-gray-50">
                                                            {sampleDataHeaders.map(header => (
                                                                <td key={`${rowIndex}-${header}`} className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 max-w-sm truncate" title={String(row[header] ?? '')}>
                                                                    {String(row[header] ?? 'N/A')}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            <Pagination
                                                currentPage={sampleDataCurrentPage}
                                                totalPages={totalSampleDataPages}
                                                onPageChange={handleSampleDataPageChange}
                                                totalItems={sampleData.length}
                                                itemsPerPage={itemsPerPage}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'Access' && (
                                <div>
                                    {loadingAccessData && <p className="text-center text-gray-500 p-4">Loading access information...</p>}
                                    {accessDataError && <p className="text-center text-red-600 p-4">Error: {accessDataError}</p>}
                                    {!loadingAccessData && !accessDataError && (
                                        accessData.length > 0 ? (
                                            <div className="overflow-hidden mt-2 rounded-lg shadow border">
                                                <table className="min-w-full">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10"></th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Count</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {currentAccessItems.map((item) => (
                                                            <React.Fragment key={`${item.type}-${item.name}`}>
                                                                <tr className="hover:bg-gray-50">
                                                                    <td className="px-6 py-4">
                                                                        <button onClick={() => toggleRow(item.name)} className="text-gray-500 hover:text-[#8d77ba] transition-colors">
                                                                            {expandedRows[item.name] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                                        </button>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.type}</td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.name}</td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.users.length}</td>
                                                                </tr>
                                                                {expandedRows[item.name] && (
                                                                    <tr>
                                                                        <td colSpan="4" className="px-6 py-4 bg-purple-50/50">
                                                                            <div className="flex items-center flex-wrap gap-2">
                                                                                <h4 className="font-semibold text-gray-700 text-sm">Users:</h4>
                                                                                {item.users.length > 0 ? (
                                                                                    item.users.map(user => (
                                                                                        <span key={user} className="bg-purple-100 text-[#8d77ba] text-xs font-semibold px-2.5 py-1 rounded-full">
                                                                                            {user}
                                                                                        </span>
                                                                                    ))
                                                                                ) : (
                                                                                    <span className="text-gray-500 italic text-sm">
                                                                                        No users found in this {item.type.toLowerCase()}.
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </React.Fragment>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                <Pagination
                                                    currentPage={accessCurrentPage}
                                                    totalPages={totalAccessPages}
                                                    onPageChange={handleAccessPageChange}
                                                    totalItems={accessData.length}
                                                    itemsPerPage={itemsPerPage}
                                                />
                                            </div>
                                        ) : (
                                            <p className="text-center text-gray-500 mt-4 p-4">No access information is available for this column.</p>
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="w-full xl:w-80 flex-shrink-0 space-y-6">
                        <div className="bg-white p-5 rounded-lg shadow-sm text-sm">
                            <div className="flex items-center gap-2">
                                <span className="text-[#8d77ba]"><Lightbulb /></span>
                                <h3 className="font-normal text-lg">Snapshot</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-y-4 border-b pb-3 pt-7">
                                <div className="text-gray-500">Data Type</div>
                                <div className="font-normal">{columnDetails?.column_metadata?.DATA_TYPE}</div>
                                <div className="text-gray-500">Data source</div>
                                <div className="font-normal">{columnDetails.connection_type}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-y-4 border-b pb-3 pt-7">
                                <div className="text-gray-500">Created on</div>
                                <div className="font-normal">{new Date(columnDetails.created_at).toLocaleDateString()}</div>
                                <div className="text-gray-500">Last updated</div>
                                <div className="font-normal">{new Date(columnDetails.updated_at).toLocaleDateString()}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-y-4 border-b pb-3 pt-7">
                                <div className="text-gray-500">Owner</div>
                                <div className="font-normal">{columnDetails.created_by}</div>
                                <div className="text-gray-500">Steward</div>
                                <div className="font-normal">{columnDetails?.steward || 'Admin'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ColumnDetailsPage;