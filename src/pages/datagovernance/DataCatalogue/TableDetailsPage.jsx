import React, { useState, useEffect } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { Pencil, Lightbulb, Table, Layers, TableOfContents, FileCheck2 } from 'lucide-react';
import Breadcrumb from '../../../components/Breadcrumb';
import { useAuth } from "../../../context/AuthContext.jsx";

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
    <span className="bg-[#8e78b7] text-white text-xs font-medium me-2 px-2.5 py-1 rounded-full">
        {label}
    </span>
);


function TableDetailsPage() {
    const location = useLocation();
    const { tableName } = useParams();
    const { tableData, columns } = location.state || {};
    const { token, decodedToken } = useAuth(); 

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

    const isUserAuthorized = decodedToken?.resource_access?.darch?.roles?.some(role =>
        ['data steward', 'data owner'].includes(role.toLowerCase())
    );

    useEffect(() => {
        if (!tableData) return;

        const fetchComplianceTags = async () => {
            setLoadingTags(true);
            try {
                const response = await fetch(`${window._env_?.VITE_FAST_API}/data_catalogue/compliance_tags`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        connection_set: [{
                            connection_name: tableData.connection_name,
                            table_schema: tableData.schema,
                            table_name: tableData.name
                        }]
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch compliance tags');
                }

                const data = await response.json();
                setComplianceTags(data.sub_tags || []);
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
            try {
                const response = await fetch(`${window._env_?.VITE_FAST_API}/data_catalogue/business_tab`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'accept': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        connection_set: [{
                            connection_name: tableData.connection_name,
                            table_schema: tableData.schema,
                            table_name: tableData.name,
                        }],
                    }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

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

                const newCompositeState = [];
                const domainNames = schemaForState.domain;
                const categoryNames = schemaForState.category;
                const subCategoryNames = schemaForState.subCategory;
                const tagNames = schemaForState.tag;
                const subTagNames = schemaForState.subTag;

                const maxLength = Math.max(
                    domainNames.length,
                    categoryNames.length,
                    subCategoryNames.length,
                    tagNames.length,
                    subTagNames.length
                );

                if (maxLength === 0) {
                    newCompositeState.push({
                        id: '01',
                        table: tableBusinessInfo.table_name || tableData.name,
                        domain: 'N/A',
                        category: 'N/A',
                        subCategory: 'N/A',
                        term: 'N/A',
                        tag: 'N/A',
                        subTag: 'N/A',
                    });
                } else {
                    for (let i = 0; i < maxLength; i++) {
                        newCompositeState.push({
                            id: (i + 1).toString().padStart(2, '0'),
                            table: tableBusinessInfo.table_name || tableData.name,
                            domain: domainNames[i] || '-',
                            category: categoryNames[i] || '-',
                            subCategory: subCategoryNames[i] || '-',
                            tag: tagNames[i] || '-',
                            subTag: subTagNames[i] || '-',
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
    }, [activeTab, tableData, token]);

    useEffect(() => {
        if (activeTab !== 'Sample data' || !tableData) return;

        const fetchSampleData = async () => {
            setLoadingSampleData(true);
            setSampleDataError(null);
            setSampleData([]);

            try {
                const response = await fetch(`${window._env_?.VITE_FAST_API}/data_catalogue/columns/sample_data`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        connection_name: tableData.connection_name,
                        table_schema: tableData.schema,
                        table_name: tableData.name
                    })
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch sample data. Status: ${response.status}`);
                }

                const data = await response.json();
                setSampleData(data || []);

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
        if (tableData) {
            const initialDesc = tableData.description || '';
            setDescription(initialDesc);
            setOriginalDescription(initialDesc);
        }
    }, [tableData]);

    const handleCancelEdit = () => {
        setDescription(originalDescription);
        setIsEditingDescription(false);
    };

    const handleSaveDescription = async () => {
        if (!tableData) {
            console.error("Table data is not available to save description.");
            alert("An error occurred. Cannot save description.");
            return;
        }
        // NOTE: Here you would add your API call to persist the description.
        // setIsSaving(true);
        // await api.saveTableDescription(tableData.id, description);
        // setIsSaving(false);
        setOriginalDescription(description);
        setIsEditingDescription(false);
    };


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
    }

    const sampleDataHeaders = sampleData.length > 0 ? Object.keys(sampleData[0]) : [];

    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            <Breadcrumb />
            <div className="mt-2 flex flex-col lg:flex-row gap-8">
                <div className="flex-grow bg-white px-6 pt-6 pb-10 rounded-lg shadow-sm min-w-0">
                    <div className="flex items-start gap-4 w-full">
                        <div className="flex justify-between w-full" >
                            <div className="flex items-center gap-2">
                                <Table size={24} className="text-gray-600" />
                                <h1 className="text-2xl font-bold text-gray-800">{tableData?.name?.toLowerCase()}</h1>
                            </div>
                            <div className="flex justify-center flex-col items-center">
                                <h2 className='font-semibold'>{tableData.column}</h2>
                                <p className="text-sm text-gray-500">Columns</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-b border-gray-200 mt-4">
                        <nav className="-mb-px flex space-x-10">
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
                                            <Pencil className="h-5 w-5 text-[#8d77ba]" /> Description
                                        </h3>
                                        {isUserAuthorized && !isEditingDescription && (
                                            <button
                                                onClick={() => setIsEditingDescription(true)}
                                                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-[#8d77ba] transition-colors"
                                                aria-label="Edit description"
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
                                    ) : (
                                        <div className="text-gray-600 pl-7 min-h-[2rem]">
                                            {description ? description : <span className="text-gray-400 italic">No description provided</span>}
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

                                {/* Columns Table Section */}
                                {columns && columns.length > 0 ? (
                                    <div className="overflow-x-auto rounded-lg shadow ">
                                        <table className="min-w-full">
                                            <thead >
                                                <tr className="bg-[#29304a] text-white">
                                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">ID</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">Name</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">Description</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">Classification</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {columns.map((col, index) => (
                                                    <tr key={col.id}>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{col.column_name}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-xs">Column Description</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">Classification</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                                            <button className="text-gray-400 hover:text-gray-600"><Pencil size={16} /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
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
                                    <div className="overflow-x-auto rounded-lg shadow">
                                        <table className="min-w-full">
                                            <thead>
                                                <tr className="bg-[#29304a] text-white">
                                                    {['ID', 'Schema', 'Domain', 'Category', 'Sub-category', 'Tag', 'Sub-tag'].map(header => (
                                                        <th key={header} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">{header}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {businessData.composite && businessData.composite.length > 0 ? (
                                                    businessData.composite.map((row, index) => (
                                                        <tr key={index} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{row.id}</td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600 hover:underline cursor-pointer">{row.table}</td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{row.domain}</td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{row.category}</td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{row.subCategory}</td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{row.tag}</td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{row.subTag}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="7" className="text-center py-10 px-4 text-sm text-gray-500">
                                                            No detailed business data available.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
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
                                    <p className="text-gray-500">No sample data is available for this table.</p>
                                )}

                                {!loadingSampleData && !sampleDataError && sampleData.length > 0 && (
                                    <div className="overflow-x-auto mt-2 rounded-lg shadow">
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
                                                {sampleData.map((row, rowIndex) => (
                                                    <tr key={rowIndex} className="hover:bg-gray-50">
                                                        {sampleDataHeaders.map(header => (
                                                            <td key={`${rowIndex}-${header}`} className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                                {row[header]}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}


                        {activeTab === 'Access' && <p>Access control and history will be displayed here.</p>}
                    </div>
                </div>

                <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
                    <div className="bg-white p-5 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Lightbulb className="h-5 w-5 text-purple-400" />  Snapshot</h2>
                        </div>
                        <div className="mt-4 space-y-3 text-sm">
                            <div className="flex justify-between"><span className="text-gray-500">Type</span> <span className="font-medium text-gray-800">Table</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Data source</span> <span className="font-medium text-gray-800">{tableData.database}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Created on</span> <span className="font-medium text-gray-800">{tableData.CreatedDate}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Last updated</span> <span className="font-medium text-gray-800">{tableData.lastUpdated}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Owner</span> <span className="font-medium text-gray-800">{tableData.owner}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Steward</span> <span className="font-medium text-gray-800">{tableData.steward || 'Admin'}</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TableDetailsPage;