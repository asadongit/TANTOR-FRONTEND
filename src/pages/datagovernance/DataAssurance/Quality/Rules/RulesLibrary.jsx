import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowUpRight, ChevronLeft, ChevronRight, List, X } from 'lucide-react';
import { Icon } from '@iconify-icon/react';
import Breadcrumb from '../../../../../components/Breadcrumb';
import { useAuth } from '../../../../../context/AuthContext';

const RulesLibrary = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [libraryData, setLibraryData] = useState([]);
    const [groupCounts, setGroupCounts] = useState({});
    const [viewMode, setViewMode] = useState('both');
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedRule, setSelectedRule] = useState(null);
    const [modalPage, setModalPage] = useState(1);
    const rowsPerPage = 5;
    const modalRowsPerPage = 5;
    const { decodedToken } = useAuth();
    const navigate = useNavigate();

    const metricsData = [
        { icon: "material-symbols:tab-group-outline", bgcolor: "bg-[#8d77ba] bg-opacity-25", iconcolor: "text-[#8d77ba]", title: "Consistency", count: groupCounts.Consistency || "-" },
        { icon: "material-symbols:tab-group-outline", bgcolor: "bg-[#8d77ba] bg-opacity-25", iconcolor: "text-[#8d77ba]", title: "Completeness", count: groupCounts.Completeness || "-" },
        { icon: "material-symbols:tab-group-outline", bgcolor: "bg-[#8d77ba] bg-opacity-25", iconcolor: "text-[#8d77ba]", title: "Validity", count: groupCounts.Validity || "-" },
        { icon: "material-symbols:tab-group-outline", bgcolor: "bg-[#8d77ba] bg-opacity-25", iconcolor: "text-[#8d77ba]", title: "Uniqueness", count: groupCounts.Uniqueness || "-" },
        { icon: "material-symbols:tab-group-outline", bgcolor: "bg-[#8d77ba] bg-opacity-25", iconcolor: "text-[#8d77ba]", title: "Accuracy", count: groupCounts.Accuracy || "-" },
        { icon: "material-symbols:tab-group-outline", bgcolor: "bg-[#8d77ba] bg-opacity-25", iconcolor: "text-[#8d77ba]", title: "Test", count: groupCounts.Test || "-" },
    ];

    const fetchLibraryData = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_FAST_API}/rules/library`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'accept': 'application/json',
                },
                body: JSON.stringify({ owner: decodedToken?.preferred_username }),
            });
            const data = await response.json();
            setLibraryData(data.rules || []);
            setGroupCounts(data.group_counts || {});
        } catch (error) {
            console.error('Error fetching library data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLibraryData();
    }, []);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const parseConnectionDetails = (mappings) => {
        const details = [];
        mappings.forEach(mapping => {
            mapping.connection_details.forEach(detail => {
                const columns = Array.isArray(detail.columns) ? detail.columns : [detail.columns];
                const tables = Array.isArray(detail.tables) ? detail.tables : [detail.tables];
                const schemas = Array.isArray(detail.schema) ? detail.schema : [detail.schema];
                columns.forEach((column, index) => {
                    if (typeof column === 'string') {
                        const parts = column.split('.');
                        if (parts.length >= 3) {
                            const schemaParts = schemas[0]?.split('.') || [''];
                            const tableParts = tables[0]?.split('.') || [''];
                            details.push({
                                connection: detail.connection || parts[0],
                                schema: schemaParts[schemaParts.length - 1] || parts[1],
                                table: tableParts[tableParts.length - 1] || parts[2],
                                column: parts.slice(3).join('.') || '-',
                            });
                        }
                    }
                });
            });
        });
        return details;
    };

    const handleViewDetails = (rule) => {
        setSelectedRule({
            ...rule,
            last_run: rule.mappings.length > 0 ? rule.mappings[0].last_run_date : '-',
        });
        setShowDetailsModal(true);
        setModalPage(1);
    };

    const filteredData = libraryData.filter(item =>
        Object.values(item).some(val =>
            val && val.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const indexOfLastItem = currentPage * rowsPerPage;
    const indexOfFirstItem = indexOfLastItem - rowsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    const goToPage = (pageNumber) => setCurrentPage(pageNumber);
    const goToPreviousPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
    const goToNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

    const modalTotalPages = selectedRule ? Math.ceil(parseConnectionDetails(selectedRule.mappings).length / modalRowsPerPage) : 0;
    const modalIndexOfLastItem = modalPage * modalRowsPerPage;
    const modalIndexOfFirstItem = modalIndexOfLastItem - modalRowsPerPage;
    const modalCurrentItems = selectedRule ? parseConnectionDetails(selectedRule.mappings).slice(modalIndexOfFirstItem, modalIndexOfLastItem) : [];

    return (
        <div className="p-6">
            <Breadcrumb />
            <div className="flex gap-4 mb-6 items-center justify-between">
                <h1 className="text-2xl font-semibold">Rule Library</h1>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search rules"
                            className="pl-10 pr-4 py-2 w-[300px] border border-gray-300 rounded-lg focus:outline-none"
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                    <button
                        type="button"
                        title={viewMode === 'both' ? "Hide Cards View" : "Show Both Views"}
                        onClick={() => setViewMode(viewMode === 'both' ? 'table' : 'both')}
                        className="text-black shadow-lg hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-3 py-2.5 dark:bg-[#ffffff] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
                    >
                        <List className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {viewMode === 'both' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
                    {isLoading ? (
                        [...Array(6)].map((_, index) => (
                            <div
                                key={index}
                                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 animate-pulse"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                                    <div className="h-4 bg-gray-200 rounded w-24" />
                                </div>
                                <div className="h-8 bg-gray-200 rounded w-16" />
                            </div>
                        ))
                    ) : (
                        metricsData.map((metric, index) => (
                            <div
                                key={index}
                                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div
                                        className={`flex items-center justify-center w-10 h-10 ${metric.bgcolor} rounded-full ${metric.iconcolor}`}
                                    >
                                        <Icon icon={metric.icon} className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-700 leading-tight">{metric.title}</h3>
                                </div>
                                <p className="text-gray-900 text-3xl font-bold">{metric.count}</p>
                            </div>
                        ))
                    )}
                </div>
            )}

            {(viewMode === 'both' || viewMode === 'table') && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1200px]">
                            <thead>
                                <tr className="bg-[#29304a] text-white">
                                    <th className="text-left p-4">ID</th>
                                    <th className="text-left p-4">Type</th>
                                    <th className="text-left p-4">Group</th>
                                    <th className="text-left p-4">Name</th>
                                    <th className="text-left p-4">Severity</th>
                                    <th className="text-left p-4">Owner</th>
                                    <th className="text-left p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    [...Array(rowsPerPage)].map((_, index) => (
                                        <tr key={index} className="border-b">
                                            <td className="p-4">
                                                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                                            </td>
                                            <td className="p-4">
                                                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                                            </td>
                                            <td className="p-4">
                                                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                                            </td>
                                            <td className="p-4">
                                                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                                            </td>
                                            <td className="p-4">
                                                <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
                                            </td>
                                            <td className="p-4">
                                                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                                            </td>
                                            <td className="p-4">
                                                <div className="h-5 w-5 bg-gray-200 rounded-full animate-pulse" />
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    currentItems.map((item) => (
                                        <tr key={item.id} className="border-b hover:bg-gray-50">
                                            <td className="p-4 font-medium">{item.id}</td>
                                            <td className="p-4 text-gray-600">{item.type}</td>
                                            <td className="p-4 text-[#8e78b7] font-medium">{item.group_name}</td>
                                            <td className="p-4 text-[#8e78b7] font-medium">{item.name}</td>
                                            <td className="p-4">
                                                <span className={`px-2 pt-1 pb-2 text-center rounded-full text-sm font-medium ${item.severity === 'High' ? 'bg-red-100 text-red-700' :
                                                        item.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-green-100 text-green-700'
                                                    }`}>
                                                    {item.severity}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-600">{item.owner}</td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => handleViewDetails(item)}
                                                    className="p-1.5 hover:bg-[#8e78b7] hover:bg-opacity-10 rounded-full"
                                                    title="View Details"
                                                >
                                                    <ArrowUpRight className="h-5 w-5 text-[#8e78b7]" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {!isLoading && (
                        <div className="flex justify-end items-center px-4 py-3 border-t">
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={goToPreviousPage}
                                    disabled={currentPage === 1}
                                    className={`p-2 rounded-lg ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                                <div className="flex items-center">
                                    {[...Array(totalPages)].map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => goToPage(index + 1)}
                                            className={`px-3 py-1 mx-1 rounded-md ${currentPage === index + 1
                                                    ? 'bg-[#8e78b7] text-white'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                                }`}
                                        >
                                            {index + 1}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={goToNextPage}
                                    disabled={currentPage === totalPages}
                                    className={`p-2 rounded-lg ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="flex justify-end mt-4">
                <button
                    onClick={() => navigate('/datagovernance/data-assurance/rules')}
                    title="Back to Rules"
                    className="px-7 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7a67a0] transition-colors"
                >
                    Back
                </button>
            </div>

            {showDetailsModal && selectedRule && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-900">Rule Details</h2>
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <span className="font-semibold text-gray-700">ID:</span>
                                <span className="ml-2 text-gray-800">{selectedRule.id}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700">Severity:</span>
                                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${selectedRule.severity === 'High' ? 'bg-red-100 text-red-700' :
                                        selectedRule.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-green-100 text-green-700'
                                    }`}>
                                    {selectedRule.severity}
                                </span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700">Name:</span>
                                <span className="ml-2 text-gray-800">{selectedRule.name || '-'}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700">Type:</span>
                                <span className="ml-2 text-gray-800">{selectedRule.type || '-'}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700">Group:</span>
                                <span className="ml-2 text-gray-800">{selectedRule.group_name || '-'}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700">Owner:</span>
                                <span className="ml-2 text-gray-800">{selectedRule.owner || '-'}</span>
                            </div>
                            <div className="col-span-2">
                                <span className="font-semibold text-gray-700">Description:</span>
                                <span className="ml-2 text-gray-800">{selectedRule.description || '-'}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700">Created Date:</span>
                                <span className="ml-2 text-gray-800">{selectedRule.created_date || '-'}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700">Last Run Date:</span>
                                <span className="ml-2 text-gray-800">{selectedRule.last_run || '-'}</span>
                            </div>
                        </div>
                        {parseConnectionDetails(selectedRule.mappings).length === 0 ? (
                            <div className="p-4 bg-gray-50 rounded-lg text-center">
                                <span className="text-gray-600">No Mappings Found</span>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto max-h-[50vh] rounded-lg border border-gray-200">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-[#29304a] text-white sticky top-0">
                                                <th className="px-4 py-2 text-left">Connection</th>
                                                <th className="px-4 py-2 text-left">Schema</th>
                                                <th className="px-4 py-2 text-left">Table</th>
                                                <th className="px-4 py-2 text-left">Column</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {modalCurrentItems.map((detail, index) => (
                                                <tr key={index} className="border-b hover:bg-gray-50">
                                                    <td className="px-4 py-2">{detail.connection || '-'}</td>
                                                    <td className="px-4 py-2">{detail.schema || '-'}</td>
                                                    <td className="px-4 py-2">{detail.table || '-'}</td>
                                                    <td className="px-4 py-2">{detail.column || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {parseConnectionDetails(selectedRule.mappings).length > modalRowsPerPage && (
                                    <div className="flex justify-end items-center py-2 border-t">
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => modalPage > 1 && setModalPage(modalPage - 1)}
                                                disabled={modalPage === 1}
                                                className={`p-1 rounded ${modalPage === 1 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </button>
                                            <div className="flex items-center">
                                                {[...Array(modalTotalPages)].map((_, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => setModalPage(index + 1)}
                                                        className={`px-2 py-1 mx-0.5 rounded ${modalPage === index + 1
                                                                ? 'bg-[#8e78b7] text-white'
                                                                : 'text-gray-600 hover:bg-gray-100'
                                                            }`}
                                                    >
                                                        {index + 1}
                                                    </button>
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => modalPage < modalTotalPages && setModalPage(modalPage + 1)}
                                                disabled={modalPage === modalTotalPages}
                                                className={`p-1 rounded ${modalPage === modalTotalPages ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                        <div className="flex justify-end mt-4">
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="px-6 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7a67a0] transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RulesLibrary;