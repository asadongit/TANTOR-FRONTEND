import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown, List, RefreshCcw, Plus, X, Copy, FileQuestion, Trash2, MoreHorizontal, Pencil, AlertTriangle } from 'lucide-react';
import { Icon } from "@iconify-icon/react";
import Breadcrumb from '../../../components/Breadcrumb.jsx';
import AddCatalogueModal from './AddCatalogueModal.jsx';
import toast, { Toaster } from 'react-hot-toast';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, isConfirming }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center animate-fadeIn" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <X className="h-5 w-5 text-gray-600" />
                    </button>
                </div>
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="mt-1">
                        <p className="text-sm text-gray-600">{message}</p>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isConfirming}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300 disabled:cursor-wait"
                    >
                        {isConfirming ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
};


const metricConfig = [
    { title: 'Domain', apiKey: 'Domain', icon: "material-symbols:tab-group-outline", bgcolor: "bg-[#8d77ba]/25", iconcolor: "text-[#8d77ba]" },
    { title: 'Term', apiKey: 'Term', icon: "material-symbols:tab-group-outline", bgcolor: "bg-[#8d77ba]/25", iconcolor: "text-[#8d77ba]" },
    { title: 'Category', apiKey: 'Category', icon: "material-symbols:tab-group-outline", bgcolor: "bg-[#8d77ba]/25", iconcolor: "text-[#8d77ba]" },
    { title: 'Sub-category', apiKey: 'Sub Category', icon: "material-symbols:tab-group-outline", bgcolor: "bg-[#8d77ba]/25", iconcolor: "text-[#8d77ba]" },
    { title: 'Tag', apiKey: 'Tag', icon: "material-symbols:tab-group-outline", bgcolor: "bg-[#8d77ba]/25", iconcolor: "text-[#8d77ba]" },
    { title: 'Sub-tag', apiKey: 'Sub Tag', icon: "material-symbols:tab-group-outline", bgcolor: "bg-[#8d77ba]/25", iconcolor: "text-[#8d77ba]" },
];

const MetricCardSkeleton = () => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 animate-pulse">
        <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
            <div className="h-4 bg-gray-300 rounded w-20"></div>
        </div>
        <div className="h-8 bg-gray-300 rounded w-1/3 mt-4"></div>
    </div>
);


const TableRowSkeleton = () => (
    <tr className="border-b animate-pulse">
        {Array.from({ length: 12 }).map((_, i) => (
            <td key={i} className="p-4">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
            </td>
        ))}
    </tr>
);


const PaginationSkeleton = () => (
    <div className="flex justify-between items-center px-4 py-3 border-t animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-48"></div>
        <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gray-200 h-9 w-9"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="p-2 rounded-lg bg-gray-200 h-9 w-9"></div>
        </div>
    </div>
);



const DetailsModal = ({ isOpen, onClose, title, data }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredData = React.useMemo(() => {
        if (!data) return [];
        return data.filter(item =>
            item.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [data, searchTerm]);


    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);


    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
        }
    }, [isOpen]);

    return (
        <div
            className={`fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={onClose}
        >
            <div
                className={`bg-white rounded-xl shadow-2xl w-full max-w-lg m-4 transform transition-all duration-300 ease-in-out ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-xl">
                    <h3 className="text-lg font-semibold text-gray-800">
                        {title}
                        <span className="ml-2 text-sm font-normal text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                            {data?.length || 0}
                        </span>
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 hover:bg-gray-200 p-1 rounded-full transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content & Search */}
                <div className="p-5">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder={`Search in ${title}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8d77ba]"
                        />
                    </div>

                    <div className="max-h-[50vh] overflow-y-auto pr-2">
                        {filteredData.length > 0 ? (
                            <ul className="space-y-2">
                                {filteredData.map((item, index) => (
                                    <li
                                        key={index}
                                        className="flex justify-between items-center bg-gray-100 p-2.5 rounded-md text-gray-800 group"
                                    >
                                        <span className="break-all">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                <FileQuestion className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                <h4 className="font-semibold">No Results Found</h4>
                                <p className="text-sm">
                                    {searchTerm
                                        ? `Your search for "${searchTerm}" did not return any results.`
                                        : 'There are no items to display.'
                                    }
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end p-4 border-t bg-gray-50 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};


const BusinessCatalogue = () => {

    const [metricCounts, setMetricCounts] = useState(null);
    const [tableData, setTableData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState('both');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [detailsModal, setDetailsModal] = useState({ isOpen: false, title: '', data: [] });
    const rowsPerPage = 10;


    const fetchCatalogueData = async () => {
        setIsLoading(true);
        setError(null);
        try {

            const response = await fetch(`${window._env_?.VITE_FAST_API}/business_catalogue/dashboard/count`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();


            setMetricCounts(data.counts);


            const formattedTableData = Object.entries(data.details).map(([id, item]) => ({
                id: `${id}`,
                domain: item.Domain,
                category: item["Domain's Categories"],
                subcategory: item["Domain's Sub-Categories"],
                term: item["Domain's Terms"],
                tag: item["Domain's Tags"],
                subtag: item["Domain's Sub-Tags"],
                description: item.Description || 'N/A',
                createdBy: item["Created By"].join(', ') || 'N/A',
                createdDate: item["Created Date"],
                updatedDate: item["Updated Date"] || 'N/A',
                status: item.Status
            }));
            setTableData(formattedTableData);

        } catch (err) {
            setError(err.message);
            console.error("Failed to fetch catalogue data:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCatalogueData();
    }, []);


    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
        setCurrentPage(1);
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <ArrowUpDown className="h-4 w-4 inline-block ml-1 opacity-40" />;
        return sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4 inline-block ml-1" /> : <ArrowDown className="h-4 w-4 inline-block ml-1" />;
    };

    const getStatusBadge = (status) => {
        const styles = {
            Active: "px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full",
            Completed: "px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full",
            Inactive: "px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full",
            Pending: "px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full",
        };
        return <span className={styles[status] || "px-2 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded-full"}>{status}</span>;
    };

    const handleOpenDetailsModal = (title, data) => {
        setDetailsModal({ isOpen: true, title, data });
    };

    const handleCloseDetailsModal = () => {
        setDetailsModal({ isOpen: false, title: '', data: [] });
    };


    const filteredAndSortedData = React.useMemo(() => {
        let filtered = tableData.filter(item =>
            Object.values(item).some(val =>
                Array.isArray(val)
                    ? val.join(' ').toLowerCase().includes(searchTerm.toLowerCase())
                    : val.toString().toLowerCase().includes(searchTerm.toLowerCase())
            )
        );

        if (sortConfig.key) {
            filtered.sort((a, b) => {
                let aValue = a[sortConfig.key] ?? '';
                let bValue = b[sortConfig.key] ?? '';

                if (Array.isArray(aValue)) aValue = aValue.length;
                if (Array.isArray(bValue)) bValue = bValue.length;


                if (sortConfig.key === 'id') {
                    aValue = parseInt(aValue, 10) || 0;
                    bValue = parseInt(bValue, 10) || 0;
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [tableData, searchTerm, sortConfig]);

    const totalPages = Math.ceil(filteredAndSortedData.length / rowsPerPage);
    const indexOfLastItem = currentPage * rowsPerPage;
    const indexOfFirstItem = indexOfLastItem - rowsPerPage;
    const currentItems = filteredAndSortedData.slice(indexOfFirstItem, indexOfLastItem);

    const goToPreviousPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1) };
    const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1) };

    const metrics = metricConfig.map(config => ({
        ...config,
        count: metricCounts ? (metricCounts[config.apiKey] || 0) : 0,
    }));

    const [activeMenu, setActiveMenu] = useState(null);

    const handleClickOutside = () => {
        setActiveMenu(null);
    };

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleOpenDeleteModal = (item) => {
        setItemToDelete(item);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        try {
            const payload = {
                id_set: [{
                    domain_id: [parseInt(itemToDelete.id, 10)]
                }]
            };

            const response = await fetch(`${window._env_?.VITE_FAST_API}/business_catalogue/dashboard/delete_element`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.detail || `HTTP error! Status: ${response.status}`);
            }

            toast.success('Domian deleted successfully!');
            handleCloseDeleteModal();
            await fetchCatalogueData();

        } catch (err) {
            console.error("Failed to delete element:", err);
            toast.error(err.message || "An unexpected error occurred.");
        } finally {
            setIsDeleting(false);
        }
    };



    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <Breadcrumb />


            <div className="flex gap-4 mb-6 items-center justify-between">
                <h1 className="text-2xl font-semibold text-gray-800">Business Catalogue</h1>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <input type="text" placeholder="Search catalogue..." className="pl-10 pr-4 py-2 w-[300px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8d77ba]" value={searchTerm} onChange={handleSearchChange} />
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                    <button onClick={fetchCatalogueData} disabled={isLoading} className="p-2.5 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-wait">
                        <RefreshCcw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7a67a0] transition-colors shadow-sm">
                        <Plus className="h-5 w-5" />
                        <span>Add</span>
                    </button>
                </div>
            </div>

            {viewMode !== 'list' && (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                    {isLoading ? (
                        Array.from({ length: 6 }).map((_, index) => <MetricCardSkeleton key={index} />)
                    ) : (
                        metrics.map((metric, index) => (
                            <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`flex items-center justify-center w-10 h-10 ${metric.bgcolor} rounded-full ${metric.iconcolor}`}>
                                        <Icon icon={metric.icon} className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-700">{metric.title}</h3>
                                </div>
                                <p className="text-gray-900 text-3xl font-bold mt-4">{metric.count}</p>
                            </div>
                        ))
                    )}
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-800 text-white">
                            <tr>
                                {['id', 'domain', 'category', 'subcategory', 'term', 'description', 'tag', 'createdBy', 'createdDate', 'updatedDate', 'status', 'Action'].map(key => (
                                    <th key={key} className="text-left p-3 font-semibold tracking-wider cursor-pointer hover:bg-gray-700" onClick={() => handleSort(key)}>
                                        <span className="inline-flex items-center capitalize">{key.replace(/([A-Z])/g, ' $1')} {getSortIcon(key)}</span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} />)
                            ) : (
                                currentItems.map((item, index) => (
                                    <tr key={item.id} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="p-3 text-gray-700 font-medium">{item.id}</td>
                                        <td className="p-3 text-gray-600">{item.domain}</td>
                                        <td className="p-3"><button onClick={() => handleOpenDetailsModal('Categories', item.category)} className="text-blue-600 underline">{item.category.length}</button></td>
                                        <td className="p-3"><button onClick={() => handleOpenDetailsModal('Sub-categories', item.subcategory)} className="text-blue-600 underline">{item.subcategory.length}</button></td>
                                        <td className="p-3"><button onClick={() => handleOpenDetailsModal('Terms', item.term)} className="text-blue-600 underline">{item.term.length}</button></td>
                                        <td className="p-3 text-gray-600 truncate max-w-xs" title={item.description}>{item.description}</td>
                                        <td className="p-3"><button onClick={() => handleOpenDetailsModal('Tags', item.tag)} className="text-blue-600 underline">{item.tag.length}</button></td>
                                        <td className="p-3 text-gray-600">{item.createdBy}</td>
                                        <td className="p-3 text-gray-600">{item.createdDate}</td>
                                        <td className="p-3 text-gray-600">{item.updatedDate}</td>
                                        <td className="p-3">{getStatusBadge(item.status)}</td>
                                        <td className="px-6 p-4 text-center whitespace-nowrap">
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
                                                                <button

                                                                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleOpenDeleteModal(item)}
                                                                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
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
                        </tbody>
                    </table>
                </div>

                {isLoading ? (
                    <PaginationSkeleton />
                ) : (
                    <div className="flex justify-between items-center px-4 py-3 border-t">
                        <span className="text-sm text-gray-600">
                            Showing {filteredAndSortedData.length > 0 ? indexOfFirstItem + 1 : 0} to {Math.min(indexOfLastItem, filteredAndSortedData.length)} of {filteredAndSortedData.length} results
                        </span>
                        <div className="flex items-center gap-1">
                            <button onClick={goToPreviousPage} disabled={currentPage === 1} className="p-2 rounded-lg disabled:text-gray-300 disabled:cursor-not-allowed text-gray-600 hover:bg-gray-100">
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <span className="text-sm text-gray-600">Page {currentPage} of {totalPages > 0 ? totalPages : 1}</span>
                            <button onClick={goToNextPage} disabled={currentPage === totalPages || totalPages === 0} className="p-2 rounded-lg disabled:text-gray-300 disabled:cursor-not-allowed text-gray-600 hover:bg-gray-100">
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                )}

            </div>

            <AddCatalogueModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
            <DetailsModal isOpen={detailsModal.isOpen} onClose={handleCloseDetailsModal} title={detailsModal.title} data={detailsModal.data} />
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleConfirmDelete}
                title="Confirm Deletion"
                message={`Are you sure you want to delete the domain "${itemToDelete?.domain}"? This action cannot be undone.`}
                isConfirming={isDeleting}
            />
        </div>
    );
};

export default BusinessCatalogue;