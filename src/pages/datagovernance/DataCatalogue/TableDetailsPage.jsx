import React, { useState, useEffect } from 'react';
import { useLocation, useParams, Link, useNavigate } from 'react-router-dom';
import { Pencil, Lightbulb, Table, Layers, TableOfContents, FileCheck2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, FilePenLine, Check, X } from 'lucide-react';
import Breadcrumb from '../../../components/Breadcrumb';
import { useAuth } from "../../../context/AuthContext.jsx";
import { toast } from 'react-hot-toast';
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


function TableDetailsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { tableName } = useParams();
    const { tableData, columns } = location.state || {};
    const { token, decodedToken } = useAuth();
    const hostnameV1 = window._env_?.VITE_FAST_API;

    // Component State
    const [activeTab, setActiveTab] = useState('Summary');
    const [complianceTags, setComplianceTags] = useState([]);
    const [loadingTags, setLoadingTags] = useState(true);
    const [loading, setLoading] = useState(true);

    // Table Description State
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [description, setDescription] = useState('');
    const [originalDescription, setOriginalDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Column Description State
    const [pageColumns, setPageColumns] = useState([]);
    const [editingColumnName, setEditingColumnName] = useState(null);
    const [editedColumnDescription, setEditedColumnDescription] = useState('');
    const [isSavingColumnDesc, setIsSavingColumnDesc] = useState(false);
    const [savingColumnName, setSavingColumnName] = useState(null);

    // Business Tab State
    const [businessView, setBusinessView] = useState('Composite view');
    const [businessData, setBusinessData] = useState({
        composite: [],
        schema: { domain: [], category: [], subCategory: [], tag: [], subTag: [] }
    });
    const [loadingBusinessData, setLoadingBusinessData] = useState(true);

    // Sample Data State
    const [sampleData, setSampleData] = useState([]);
    const [loadingSampleData, setLoadingSampleData] = useState(false);
    const [sampleDataError, setSampleDataError] = useState(null);

    // Access Tab State
    const [accessData, setAccessData] = useState([]);
    const [loadingAccessData, setLoadingAccessData] = useState(false);
    const [accessDataError, setAccessDataError] = useState(null);
    const [expandedRows, setExpandedRows] = useState({});

    // Pagination States
    const [itemsPerPage] = useState(5);
    const [summaryColumnsCurrentPage, setSummaryColumnsCurrentPage] = useState(1);
    const [accessCurrentPage, setAccessCurrentPage] = useState(1);
    const [businessCurrentPage, setBusinessCurrentPage] = useState(1);
    const [sampleDataCurrentPage, setSampleDataCurrentPage] = useState(1);

    const isUserAuthorized = decodedToken?.resource_access?.darch?.roles?.some(role =>
        ['persona:data steward', 'persona:data owner'].includes(role.toLowerCase())
    );

    const fetchAllData = async () => {
        if (!tableData) return;
        try {
            setLoading(true);
            const secureQueryResponse = await secureQuery({ user_query: "" }, token);
            const policyIds = secureQueryResponse.matched_policy_ids || [];
            const allConnectionsData = await fetchConnectionDetails(policyIds, token);

            const currentTableData = allConnectionsData.find(
                item => item.connection_name === tableData.connection_name &&
                    item.table_schema === tableData.schema &&
                    item.table_name === tableData.name
            );

            if (currentTableData) {
                const updatedTableData = {
                    ...tableData,
                    description: currentTableData.table_description || 'Table Description'
                };
                setDescription(updatedTableData.description);
                setOriginalDescription(updatedTableData.description); // Set original description

                const updatedColumns = columns.map(col => {
                    const columnTagInfo = currentTableData.tags_column_json?.find(
                        tag => tag.column_name === col.column_name
                    );
                    return {
                        ...col,
                        tags_column_json: columnTagInfo ? [columnTagInfo] : col.tags_column_json
                    };
                });
                setPageColumns(updatedColumns);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load table data');
        } finally {
            setLoading(false);
        }
    };

    const refetchTableData = async () => {
        if (!tableData) return;
        try {
            const secureQueryResponse = await secureQuery({ user_query: "" }, token);
            const policyIds = secureQueryResponse.matched_policy_ids || [];
            const allConnectionsData = await fetchConnectionDetails(policyIds, token);

            const currentTableData = allConnectionsData.find(
                item => item.connection_name === tableData.connection_name &&
                    item.table_schema === tableData.schema &&
                    item.table_name === tableData.name
            );

            if (currentTableData) {
                const updatedTableData = {
                    ...tableData,
                    description: currentTableData.table_description || 'Table Description'
                };
                setDescription(updatedTableData.description);
                setOriginalDescription(updatedTableData.description); // Set original description on refetch

                const updatedColumns = pageColumns.map(col => {
                    const columnTagInfo = currentTableData.tags_column_json?.find(
                        tag => tag.column_name === col.column_name
                    );
                    return {
                        ...col,
                        tags_column_json: columnTagInfo ? [columnTagInfo] : col.tags_column_json
                    };
                });
                setPageColumns(updatedColumns);
            }
        } catch (error) {
            console.error('Error refetching table data:', error);
            toast.error('Failed to refresh table data');
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [tableData, token]);

    useEffect(() => {
        if (!tableData) return;

        const fetchComplianceTags = async () => {
            setLoadingTags(true);
            try {
                const response = await fetch(`${hostnameV1}/data_catalogue/compliance_tags`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'accept': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        connection_set: [{
                            connection_name: tableData.connection_name,
                            table_schema: tableData.schema,
                            table_name: tableData.name
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
    }, [tableData, token]);

    useEffect(() => {
        if (activeTab !== 'Business' || !tableData) return;

        const fetchBusinessData = async () => {
            setLoadingBusinessData(true);
            setBusinessCurrentPage(1);
            try {
                const response = await fetch(`${hostnameV1}/data_catalogue/business_tab`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'accept': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        connection_set: [{
                            connection_name: tableData.connection_name,
                            table_schema: tableData.schema,
                            table_name: tableData.name,
                        }],
                    }),
                });

                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                const tableBusinessInfo = Object.values(data)[0];

                if (!tableBusinessInfo || !tableBusinessInfo.table_tags) {
                    throw new Error("Business data format from API is incorrect.");
                }

                const tags = tableBusinessInfo.table_tags;
                const schemaForState = {
                    domain: tags.domain?.map(t => t.name) || [],
                    category: tags.category?.map(t => t.name) || [],
                    subCategory: tags.sub_category?.map(t => t.name) || [],
                    tag: tags.tag?.map(t => t.name) || [],
                    subTag: tags.sub_tag?.map(t => t.name) || [],
                };
                const { domain, category, subCategory, tag, subTag } = schemaForState;
                const maxLength = Math.max(domain.length, category.length, subCategory.length, tag.length, subTag.length);
                const newCompositeState = [];

                if (maxLength === 0) {
                    newCompositeState.push({ id: '01', table: tableData.name, domain: 'N/A', category: 'N/A', subCategory: 'N/A', term: 'N/A', tag: 'N/A', subTag: 'N/A' });
                } else {
                    for (let i = 0; i < maxLength; i++) {
                        newCompositeState.push({
                            id: (i + 1).toString().padStart(2, '0'),
                            table: tableBusinessInfo.table_name || tableData.name,
                            domain: domain[i] || '-',
                            category: category[i] || '-',
                            subCategory: subCategory[i] || '-',
                            tag: tag[i] || '-',
                            subTag: subTag[i] || '-',
                        });
                    }
                }
                setBusinessData({ schema: schemaForState, composite: newCompositeState });
            } catch (error) {
                console.error('Error fetching business data:', error);
                setBusinessData({
                    composite: [],
                    schema: { domain: [], category: [], subCategory: [], tag: [], subTag: [] }
                });
            } finally {
                setLoadingBusinessData(false);
            }
        };
        fetchBusinessData();
    }, [activeTab, tableData, token]);

    useEffect(() => {
        if (activeTab !== 'Sample data' || !tableData) return;
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
                        connection_name: tableData.connection_name,
                        table_schema: tableData.schema,
                        table_name: tableData.name
                    })
                });
                if (!response.ok) throw new Error(`Failed to fetch sample data. Status: ${response.status}`);
                const dataText = await response.text();
                if (!dataText.trim()) {
                    setSampleData([]);
                    setLoadingSampleData(false);
                    return;
                }
                const rows = dataText
                    .trim()
                    .split('\n')
                    .filter(row => row.trim() !== '')
                    .map(row => JSON.parse(row));

                setSampleData(rows);
            } catch (error) {
                console.error("Error fetching sample data:", error);
                setSampleDataError("Failed to fetch sample data.");
            } finally {
                setLoadingSampleData(false);
            }
        };
        fetchSampleData();
    }, [activeTab, tableData, token]);

    useEffect(() => {
        if (activeTab !== 'Access' || !tableData) return;
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
                            connection_name: tableData.connection_name,
                            table_schema: tableData.schema,
                            table_name: tableData.name
                        }]
                    })
                });
                if (!response.ok) throw new Error(`Failed to fetch access data. Status: ${response.status}`);
                const data = await response.json();
                const processedData = [];
                if (data.role) Object.entries(data.role).forEach(([name, users]) => processedData.push({ type: 'Role', name, users: users || [] }));
                if (data.group) Object.entries(data.group).forEach(([name, users]) => processedData.push({ type: 'Group', name, users: users || [] }));
                if (data.subgroup) Object.entries(data.subgroup).forEach(([name, users]) => processedData.push({ type: 'Sub-group', name, users: users || [] }));
                setAccessData(processedData);
            } catch (error) {
                console.error("Error fetching access data:", error);
                setAccessDataError("Failed to load access information.");
            } finally {
                setLoadingAccessData(false);
            }
        };
        fetchAccessData();
    }, [activeTab, tableData, token]);

    const handleCancelEdit = () => {
        setDescription(originalDescription);
        setIsEditingDescription(false);
    };

    const handleSaveDescription = async () => {
        if (!tableData) return toast.error("Table data is not available.");
        if (description.trim() === '') {
            toast.error("Description cannot be empty.");
            return;
        }
        const trimmedDescription = description.trim();
        setIsSaving(true);
        setIsEditingDescription(false);
        const creatorRoles = decodedToken?.resource_access?.darch?.roles || [];
        const creatorArray = creatorRoles.map(role =>
            role.startsWith('persona:') ? role.replace('persona:', '') : role
        );
        try {
            const response = await fetch(`${hostnameV1}/data_catalogue/edit_table_description`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'accept': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    connection_name: tableData.connection_name,
                    table_schema: tableData.schema,
                    table_name: tableData.name,
                    table_description: trimmedDescription,
                    roles: creatorArray || [],
                    owner: decodedToken?.preferred_username
                })
            });
            if (!response.ok) {
                const errorData = await response.json();
                await refetchTableData();
                throw new Error(errorData.detail || "Failed to save description.");
            }
            const successData = await response.json();
            toast.success(successData.message || "Description updated successfully!");
            await refetchTableData();
        } catch (error) {
            console.error("Error saving description:", error);
            toast.error(error.message || "Failed to update description.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleColumnEditClick = (column) => {
        const tagInfo = column.tags_column_json?.find(tag => tag.column_name === column.column_name);
        const currentDesc = tagInfo?.column_description?.[0] || 'Column Description';
        setEditingColumnName(column.column_name);
        setEditedColumnDescription(currentDesc);
    };

    const handleColumnEditCancel = () => {
        setEditingColumnName(null);
        setEditedColumnDescription('');
    };

    const handleSaveColumnDescription = async () => {
        if (!editingColumnName) return;
        if (editedColumnDescription.trim() === '') {
            toast.error("Description cannot be empty.");
            return;
        }
        const trimmedDescription = editedColumnDescription.trim();
        setIsSavingColumnDesc(true);
        setSavingColumnName(editingColumnName);
        handleColumnEditCancel();
        const creatorRoles = decodedToken?.resource_access?.darch?.roles || [];
        const creatorArray = creatorRoles.map(role =>
            role.startsWith('persona:') ? role.replace('persona:', '') : role
        );
        try {
            const response = await fetch(`${hostnameV1}/data_catalogue/edit_column_description`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'accept': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    connection_name: tableData.connection_name,
                    table_schema: tableData.schema,
                    table_name: tableData.name,
                    column_name: editingColumnName,
                    column_description: trimmedDescription,
                    roles: creatorArray || [],
                    owner: decodedToken?.preferred_username
                })
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || "Failed to update column description.");
            }
            const successData = await response.json();
            toast.success(successData.message || "Description updated successfully!");
            await refetchTableData();
        } catch (error) {
            console.error("Error saving column description:", error);
            toast.error(error.message || "An error occurred.");
            await refetchTableData();
        } finally {
            setIsSavingColumnDesc(false);
            setSavingColumnName(null);
        }
    };

    const toggleRow = (name) => {
        setExpandedRows(prev => ({ ...prev, [name]: !prev[name] }));
    };

    const indexOfLastSummaryColumn = summaryColumnsCurrentPage * itemsPerPage;
    const indexOfFirstSummaryColumn = indexOfLastSummaryColumn - itemsPerPage;
    const currentSummaryColumns = pageColumns.slice(indexOfFirstSummaryColumn, indexOfLastSummaryColumn);
    const totalSummaryColumnPages = Math.ceil(pageColumns.length / itemsPerPage);
    const handleSummaryColumnPageChange = (page) => setSummaryColumnsCurrentPage(page);

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

    if (!tableData) {
        return (
            <div className="p-4">
                Table data not found. Please navigate from the tables list.
                <Link to="/datagovernance/data-catalogue/table" className="text-blue-600"> Go back</Link>
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
                                    <Table size={24} className="text-[#8d77ba]" />
                                    <h1 className="text-2xl font-bold text-gray-800">{tableData?.name?.toLowerCase()}</h1>
                                </div>
                                <div className="flex justify-center flex-col items-center">
                                    <h2 className='font-semibold'>{tableData.column}</h2>
                                    <p className="text-sm text-gray-500">Columns</p>
                                </div>
                            </div>
                        </div>

                        <div className="border-b border-gray-200 mt-4">
                            <nav className="-mb-px flex space-x-10 overflow-x-auto">
                                {tabs.map(tab => (
                                    <Tab key={tab} label={tab} activeTab={activeTab} setActiveTab={setActiveTab} />
                                ))}
                            </nav>
                        </div>

                        <div className="mt-6">
                            {activeTab === 'Summary' && (
                                <div className='space-y-6'>
                                    {/* Description Section */}
                                    <div>
                                        <div className='flex items-center justify-between mb-2'>
                                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                                <FilePenLine className="h-5 w-5 text-[#8d77ba]" /> Description
                                            </h3>
                                            {isUserAuthorized && !isEditingDescription && (
                                                <button
                                                    onClick={() => setIsEditingDescription(true)}
                                                    className="p-1 rounded-full hover:bg-gray-100 text-[#8d77ba] transition-colors"
                                                    title="Edit Table Description"
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
                                                    placeholder="Enter table description..."
                                                />
                                                <div className="flex justify-end gap-2 mt-2">
                                                    <button onClick={handleCancelEdit} className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">Cancel</button>
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
                                            <div className="text-gray-500 pl-7 min-h-[2rem]">
                                                Saving description...
                                            </div>
                                        ) : (
                                            <div className="text-gray-600 pl-7 min-h-[2rem]">
                                                {description || 'Table Description'}
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
                                            {loadingTags ? <InfoPill label="Loading..." />
                                                : complianceTags.length > 0 ? (
                                                    complianceTags.map((tag, index) => <InfoPill key={index} label={tag} />)
                                                ) : <InfoPill label="N/A" />
                                            }
                                        </div>
                                    </div>

                                    {/* Columns Table */}
                                    {pageColumns && pageColumns.length > 0 ? (
                                        <div className="overflow-hidden rounded-lg shadow border">
                                            <table className="min-w-full">
                                                <thead>
                                                    <tr className="bg-[#29304a] text-white">
                                                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">ID</th>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">Name</th>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">Description</th>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">Classification</th>
                                                        {isUserAuthorized && (
                                                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">Action</th>
                                                        )}
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {currentSummaryColumns.map((col, index) => {
                                                        const isEditingThisRow = editingColumnName === col.column_name;
                                                        const columnTagInfo = col.tags_column_json?.find(tagInfo => tagInfo.column_name === col.column_name);
                                                        const colDescription = columnTagInfo?.column_description?.[0] || 'Column Description';

                                                        return (
                                                            <tr key={col.column_name}>
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{indexOfFirstSummaryColumn + index + 1}</td>
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{col.column_name}</td>
                                                                <td className="px-4 py-3 text-sm text-gray-500 max-w-xs">
                                                                    {isEditingThisRow ? (
                                                                        <input
                                                                            type="text"
                                                                            value={editedColumnDescription}
                                                                            onChange={(e) => setEditedColumnDescription(e.target.value)}
                                                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-400"
                                                                            autoFocus
                                                                            disabled={isSavingColumnDesc}
                                                                        />
                                                                    ) : savingColumnName === col.column_name ? (
                                                                        <span className="text-gray-500 italic">Saving...</span>
                                                                    ) : (
                                                                        <span className="truncate">{colDescription}</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">Classification</td>
                                                                {isUserAuthorized && (
                                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                                                        {isEditingThisRow ? (
                                                                            <div className="flex items-center gap-3">
                                                                                <button
                                                                                    onClick={handleSaveColumnDescription}
                                                                                    disabled={isSavingColumnDesc}
                                                                                    className="text-green-600 hover:text-green-800 disabled:text-gray-300"
                                                                                    title="Save"
                                                                                >
                                                                                    <Check size={20} />
                                                                                </button>
                                                                                <button
                                                                                    onClick={handleColumnEditCancel}
                                                                                    disabled={isSavingColumnDesc}
                                                                                    className="text-red-500 hover:text-red-700 disabled:text-gray-300"
                                                                                    title="Cancel"
                                                                                >
                                                                                    <X size={20} />
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <button
                                                                                onClick={() => handleColumnEditClick(col)}
                                                                                className="text-gray-400 hover:text-gray-600"
                                                                                title="Edit Column Description"
                                                                                disabled={savingColumnName !== null}
                                                                            >
                                                                                <Pencil size={16} />
                                                                            </button>
                                                                        )}
                                                                    </td>
                                                                )}
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                            <Pagination
                                                currentPage={summaryColumnsCurrentPage}
                                                totalPages={totalSummaryColumnPages}
                                                onPageChange={handleSummaryColumnPageChange}
                                                totalItems={pageColumns.length}
                                                itemsPerPage={itemsPerPage}
                                            />
                                        </div>
                                    ) : (
                                        <div className="mt-6 border rounded-lg p-10 text-center bg-gray-50">
                                            <h3 className="text-lg font-medium text-gray-900">No Columns Found</h3>
                                            <p className="mt-1 text-sm text-gray-500">There is no column data available for this table.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'Business' && (
                                <div>
                                    <div className="flex items-center space-x-2 mb-6">
                                        <button onClick={() => setBusinessView('Composite view')}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-colors ${businessView === 'Composite view' ? 'bg-purple-100 text-[#8d77ba]' : 'text-gray-600 hover:bg-gray-100'}`}>
                                            <Layers size={20} /> Composite view
                                        </button>
                                        <button onClick={() => setBusinessView('Table Detail View')}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-colors ${businessView === 'Table Detail View' ? 'bg-purple-100 text-[#8d77ba]' : 'text-gray-600 hover:bg-gray-100'}`}>
                                            <TableOfContents size={20} /> Table Detail View
                                        </button>
                                    </div>
                                    {loadingBusinessData ? <div className="text-center p-10">Loading business data...</div>
                                        : businessView === 'Table Detail View' ? (
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
                                                                                if (values.length > 3 || fullText.length > 100) {
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
                                                        No business data available for this table.
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="p-1">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                                    {Object.values(businessData.schema).some(pills => pills.length > 0) ? (
                                                        Object.entries(businessData.schema).map(([title, pills]) => (
                                                            <div key={title}>
                                                                <h3 className="text-base font-semibold text-gray-700 mb-3 capitalize">{formatTitle(title)}</h3>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {pills.length > 0 ? pills.map(item => <InfoPill key={item} label={item} />) : <InfoPill label="N/A" />}
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        Object.keys(businessData.schema).map(title => (
                                                            <div key={title}>
                                                                <h3 className="text-base font-semibold text-gray-700 mb-3 capitalize">{formatTitle(title)}</h3>
                                                                <div className="flex flex-wrap gap-2">
                                                                    <InfoPill label="N/A" />
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                </div>
                            )}

                            {activeTab === 'Sample data' && (
                                <div>
                                    {loadingSampleData && <p className="text-gray-500 text-center p-4">Loading sample data...</p>}
                                    {sampleDataError && <p className="text-red-600 text-center p-4">Error: {sampleDataError}</p>}

                                    {!loadingSampleData && !sampleDataError && sampleData.length === 0 && (
                                        <div className="mt-6 border rounded-lg p-10 text-center bg-gray-50">
                                            <h3 className="text-lg font-medium text-gray-900">No Sample Data</h3>
                                        </div>
                                    )}

                                    {!loadingSampleData && !sampleDataError && sampleData.length > 0 && (
                                        <div className="overflow-x-auto mt-2 rounded-lg shadow border">
                                            <table className="min-w-max w-full">
                                                <thead>
                                                    <tr className="bg-[#29304a] text-white">
                                                        {sampleDataHeaders.map(header => (
                                                            <th key={header} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">{header.replace(/_/g, ' ')}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {currentSampleDataItems.map((row, rowIndex) => (
                                                        <tr key={rowIndex} className="hover:bg-gray-50">
                                                            {sampleDataHeaders.map(header => (
                                                                <td key={`${rowIndex}-${header}`} className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 max-w-sm truncate" title={String(row[header] ?? 'N/A')}>{String(row[header] ?? 'N/A')}</td>
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
                                                                                        <span key={user} className="bg-purple-100 text-[#8d77ba] text-xs font-semibold px-2.5 py-1 rounded-full">{user}</span>
                                                                                    ))
                                                                                ) : (
                                                                                    <span className="text-gray-500 italic text-sm">No users found in this {item.type.toLowerCase()}.</span>
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
                                            <p className="text-center text-gray-500 mt-4 p-4">No access information is available for this table.</p>
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
                                <div className="text-gray-500">Type</div>
                                <div className="font-normal">Table</div>
                                <div className="text-gray-500">Data source</div>
                                <div className="font-normal">{tableData?.database}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-y-4 border-b pb-3 pt-7">
                                <div className="text-gray-500">Created on</div>
                                <div className="font-normal">{tableData?.CreatedDate}</div>
                                <div className="text-gray-500">Last updated</div>
                                <div className="font-normal">{tableData?.lastUpdated}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-y-4 border-b pb-3 pt-7">
                                <div className="text-gray-500">Owner</div>
                                <div className="font-normal">{tableData?.owner}</div>
                                <div className="text-gray-500">Steward</div>
                                <div className="font-normal">{tableData?.steward || 'Admin'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TableDetailsPage;