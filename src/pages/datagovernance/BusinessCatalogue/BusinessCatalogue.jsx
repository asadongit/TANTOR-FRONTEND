import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown, List, RefreshCcw, Plus} from 'lucide-react';
import { Icon } from "@iconify-icon/react";
import Breadcrumb from '../../../components/Breadcrumb.jsx';
import AddCatalogueModal from './AddCatalogueModal.jsx';

const BusinessCatalogue = () => {
    // Static data for the metric cards at the top
    const metrics = [
        { title: 'Domain', count: 6, icon: "material-symbols:tab-group-outline", bgcolor: "bg-[#8d77ba] bg-opacity-25", iconcolor: "text-[#8d77ba]" },
        { title: 'Terms', count: 161, icon: "material-symbols:tab-group-outline", bgcolor: "bg-[#8d77ba] bg-opacity-25", iconcolor: "text-[#8d77ba]" },
        { title: 'Category', count: 7, icon: "material-symbols:tab-group-outline", bgcolor: "bg-[#8d77ba] bg-opacity-25", iconcolor: "text-[#8d77ba]" },
        { title: 'Sub-category', count: 12, icon: "material-symbols:tab-group-outline", bgcolor: "bg-[#8d77ba] bg-opacity-25", iconcolor: "text-[#8d77ba]" },
        { title: 'Tag', count: 18, icon: "material-symbols:tab-group-outline", bgcolor: "bg-[#8d77ba] bg-opacity-25", iconcolor: "text-[#8d77ba]" },
        { title: 'Sub-tag', count: 27, icon: "material-symbols:tab-group-outline", bgcolor: "bg-[#8d77ba] bg-opacity-25", iconcolor: "text-[#8d77ba]" },
    ];

    const tableData = [
        { id: '#457', domain: 'Oracle_1', category: 'Category1', subcategory: 'Subcategory1', term: 'Term', description: 'Lorem ipsum is simply', tag: 'Tag1', createdBy: 'John doe', createdDate: '24/10/2024', updatedDate: '24/10/2024', status: 'Completed' },
        { id: '#457', domain: 'Oracle_1', category: 'Category1', subcategory: 'Subcategory1', term: 'Term', description: 'Lorem ipsum is simply', tag: 'Tag1', createdBy: 'John doe', createdDate: '24/10/2024', updatedDate: '24/10/2024', status: 'Completed' },
        { id: '#457', domain: 'Oracle_1', category: 'Category1', subcategory: 'Subcategory1', term: 'Term', description: 'Lorem ipsum is simply', tag: 'Tag1', createdBy: 'John doe', createdDate: '24/10/2024', updatedDate: '24/10/2024', status: 'Pending' },
        { id: '#457', domain: 'Oracle_1', category: 'Category1', subcategory: 'Subcategory1', term: 'Term', description: 'Lorem ipsum is simply', tag: 'Tag1', createdBy: 'John doe', createdDate: '24/10/2024', updatedDate: '24/10/2024', status: 'Completed' },
        { id: '#457', domain: 'Oracle_1', category: 'Category2', subcategory: 'Subcategory1', term: 'Term', description: 'Lorem ipsum is simply', tag: 'Tag1', createdBy: 'John doe', createdDate: '24/10/2024', updatedDate: '24/10/2024', status: 'Pending' },
        { id: '#457', domain: 'Oracle_1', category: 'Category1', subcategory: 'Subcategory1', term: 'Term', description: 'Lorem ipsum is simply', tag: 'Tag1', createdBy: 'John doe', createdDate: '24/10/2024', updatedDate: '24/10/2024', status: 'Completed' },
        { id: '#457', domain: 'Oracle_1', category: 'Category1', subcategory: 'Subcategory1', term: 'Term', description: 'Lorem ipsum is simply', tag: 'Tag1', createdBy: 'John doe', createdDate: '24/10/2024', updatedDate: '24/10/2024', status: 'Completed' },
    ];

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState('both');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const rowsPerPage = 5;

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to first page on new search
    };

    const handleSort = (key) => {
        setSortConfig(prev => {
            if (prev.key === key && prev.direction === 'asc') {
                return { key, direction: 'desc' };
            }
            return { key, direction: 'asc' };
        });
        setCurrentPage(1);
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) {
            return <ArrowUpDown className="h-4 w-4 inline-block ml-1 opacity-50" />;
        }
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="h-4 w-4 inline-block ml-1" />
            : <ArrowDown className="h-4 w-4 inline-block ml-1" />;
    };

    const getStatusBadge = (status) => {
        const styles = {
            Completed: "px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full",
            Pending: "px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full",
            Failed: "px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full",
        };
        return <span className={styles[status] || "px-2 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded-full"}>{status}</span>;
    };

    const filteredData = tableData
        .filter(item =>
            Object.values(item).some(val =>
                val.toString().toLowerCase().includes(searchTerm.toLowerCase())
            )
        )
        .sort((a, b) => {
            if (!sortConfig.key) return 0;
            let aValue = a[sortConfig.key] || '';
            let bValue = b[sortConfig.key] || '';

            if (sortConfig.key === 'id') {
                aValue = parseInt(aValue.replace('#', ''), 10) || 0;
                bValue = parseInt(bValue.replace('#', ''), 10) || 0;
                return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
            }

            return sortConfig.direction === 'asc'
                ? aValue.toString().localeCompare(bValue.toString())
                : bValue.toString().localeCompare(aValue.toString());
        });

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);

    // *** LINES ADDED BACK IN ***
    const indexOfLastItem = currentPage * rowsPerPage;
    const indexOfFirstItem = indexOfLastItem - rowsPerPage;

    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    const goToPage = (pageNumber) => setCurrentPage(pageNumber);
    const goToPreviousPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1) };
    const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1) };

    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="p-6">
            <Breadcrumb />

            <div className="flex gap-4 mb-6 items-center justify-between">
                <h1 className="text-2xl font-semibold">Business Catalogue</h1>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search catalogue..."
                            className="pl-10 pr-4 py-2 w-[300px] border border-gray-300 rounded-lg focus:outline-none"
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                    <button
                        type="button"
                        onClick={() => setViewMode(viewMode === 'both' ? 'list' : 'both')}
                        title={viewMode === 'both' ? "Hide Card View" : "Show Card View"}
                        className="text-black border border-gray-300 shadow-sm hover:bg-gray-100 focus:ring-1 focus:ring-gray-300 rounded-lg text-sm px-3 py-2.5"
                    >
                        <List className="h-5 w-5" />
                    </button>
                    <button
                        disabled={isLoading}
                        className="text-black border border-gray-300 shadow-lg hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-3 py-2.5 me-2 dark:bg-[#ffffff] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
                    >
                        <RefreshCcw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7a67a0] transition-colors"
                        onClick={() => setIsModalOpen(true)} 
                    >
                        <Plus className="h-4 w-4" />
                        <span>Add</span>
                    </button>
                </div>
            </div>

            {viewMode !== 'list' && (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                    {metrics.map((metric, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`flex items-center justify-center w-10 h-10 ${metric.bgcolor} rounded-full ${metric.iconcolor}`}>
                                    <Icon icon={metric.icon} className="w-5 h-5" />
                                </div>
                                <h3 className="text-sm font-medium text-gray-700 leading-tight">{metric.title}</h3>
                            </div>
                            <p className="text-gray-900 text-2xl font-bold leading-none mt-4">{metric.count}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[#29304a] text-white">
                                <th className="text-left p-4 cursor-pointer hover:bg-[#3a4563]" onClick={() => handleSort('id')}>
                                    <span className="inline-flex items-center">ID {getSortIcon('id')}</span>
                                </th>
                                <th className="text-left p-4 cursor-pointer hover:bg-[#3a4563]" onClick={() => handleSort('domain')}>
                                    <span className="inline-flex items-center">Domain {getSortIcon('domain')}</span>
                                </th>
                                <th className="text-left p-4 cursor-pointer hover:bg-[#3a4563]" onClick={() => handleSort('category')}>
                                    <span className="inline-flex items-center">Category {getSortIcon('category')}</span>
                                </th>
                                <th className="text-left p-4 cursor-pointer hover:bg-[#3a4563]" onClick={() => handleSort('category')}>
                                    <span className="inline-flex items-center">Sub Category {getSortIcon('subcategory')}</span>
                                </th>
                                <th className="text-left p-4 cursor-pointer hover:bg-[#3a4563]" onClick={() => handleSort('category')}>
                                    <span className="inline-flex items-center">Term {getSortIcon('term')}</span>
                                </th>
                                <th className="text-left p-4 cursor-pointer hover:bg-[#3a4563]" onClick={() => handleSort('category')}>
                                    <span className="inline-flex items-center">Description {getSortIcon('description')}</span>
                                </th>
                                <th className="text-left p-4 cursor-pointer hover:bg-[#3a4563]" onClick={() => handleSort('category')}>
                                    <span className="inline-flex items-center">Tag {getSortIcon('tag')}</span>
                                </th>
                                <th className="text-left p-4 cursor-pointer hover:bg-[#3a4563]" onClick={() => handleSort('createdBy')}>
                                    <span className="inline-flex items-center">Created By {getSortIcon('createdBy')}</span>
                                </th>
                                <th className="text-left p-4 cursor-pointer hover:bg-[#3a4563]" onClick={() => handleSort('category')}>
                                    <span className="inline-flex items-center">Created Date {getSortIcon('createdDate')}</span>
                                </th>
                                <th className="text-left p-4 cursor-pointer hover:bg-[#3a4563]" onClick={() => handleSort('category')}>
                                    <span className="inline-flex items-center">Updated Date {getSortIcon('updatedDate')}</span>
                                </th>
                                <th className="text-left p-4 cursor-pointer hover:bg-[#3a4563]" onClick={() => handleSort('status')}>
                                    <span className="inline-flex items-center">Status {getSortIcon('status')}</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map((item, index) => (
                                <tr key={index} className="border-b hover:bg-gray-50">
                                    <td className="p-4">{item.id}</td>
                                    <td className="p-4">{item.domain}</td>
                                    <td className="p-4">{item.category}</td>
                                    <td className="p-4">{item.subcategory}</td>
                                    <td className="p-4">{item.term}</td>
                                    <td className="p-4">{item.description}</td>
                                    <td className="p-4">{item.tag}</td>
                                    <td className="p-4">{item.createdBy}</td>
                                    <td className="p-4">{item.createdDate}</td>
                                    <td className="p-4">{item.updatedDate}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded ${item.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-between items-center px-4 py-3 border-t">
                    <span className="text-sm text-gray-600">
                        Showing {filteredData.length > 0 ? indexOfFirstItem + 1 : 0} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} results
                    </span>
                    <div className="flex items-center gap-1">
                        <button onClick={goToPreviousPage} disabled={currentPage === 1} className="p-2 rounded-lg disabled:text-gray-300 disabled:cursor-not-allowed text-gray-600 hover:bg-gray-100">
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <span className="text-sm text-gray-600">
                            Page {currentPage} of {totalPages > 0 ? totalPages : 1}
                        </span>
                        <button onClick={goToNextPage} disabled={currentPage === totalPages} className="p-2 rounded-lg disabled:text-gray-300 disabled:cursor-not-allowed text-gray-600 hover:bg-gray-100">
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
            <AddCatalogueModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
};

export default BusinessCatalogue;