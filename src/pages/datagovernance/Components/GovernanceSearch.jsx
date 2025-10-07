import React, { useState, useEffect } from 'react';
import { Search, Info, ArrowRight, ChevronDown, X, SlidersHorizontal, Table, Columns4, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { secureQuery } from '../DataCatalogue/Components/function';

const GovernanceSearch = ({ activeSection }) => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [hasSearchedData, setHasSearchedData] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isFetchingResults, setIsFetchingResults] = useState(false);
    const [isFetchingFilters, setIsFetchingFilters] = useState(false);
    const [policyIds, setPolicyIds] = useState([]);
    const [sortBy, setSortBy] = useState('relevance');
    const [filterData, setFilterData] = useState({});
    const [selectedFilters, setSelectedFilters] = useState({});
    const [expandedSections, setExpandedSections] = useState({});
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [noDataFound, setNoDataFound] = useState(false);

    useEffect(() => {
        setSearchTerm('');
        setHasSearchedData(false);
        setIsModalOpen(false);
        setSearchResults([]);
        setShowResults(false);
        setFilterData({});
        setSelectedFilters({});
        setExpandedSections({});
        setIsSearching(false);
        setIsFetchingResults(false);
        setIsFetchingFilters(false);
        setNoDataFound(false);
        setSortBy('relevance');
    }, [activeSection]);

    const getSortedResults = (results) => {
        if (!results || results.length === 0) return results;
        
        const sortedResults = [...results];
        
        switch (sortBy) {
            case 'name-asc':
                return sortedResults.sort((a, b) => {
                    const nameA = a.type === 'table' ? a.table_name : a.column_name;
                    const nameB = b.type === 'table' ? b.table_name : b.column_name;
                    return nameA.localeCompare(nameB);
                });
                
            case 'name-desc':
                return sortedResults.sort((a, b) => {
                    const nameA = a.type === 'table' ? a.table_name : a.column_name;
                    const nameB = b.type === 'table' ? b.table_name : b.column_name;
                    return nameB.localeCompare(nameA);
                });
                
            case 'type':
                return sortedResults.sort((a, b) => {
                    if (a.type === b.type) {
                        const nameA = a.type === 'table' ? a.table_name : a.column_name;
                        const nameB = b.type === 'table' ? b.table_name : b.column_name;
                        return nameA.localeCompare(nameB);
                    }
                    return a.type.localeCompare(b.type);
                });
                
            case 'relevance':
            default:
                return results;
        }
    };

    const handleSearch = async () => {
        if (!searchTerm.trim()) return;

        setIsSearching(true);
        setIsFetchingFilters(true);

        try {
            const secureQueryResponse = await secureQuery({ user_query: "" }, token);
            const matched_ids = secureQueryResponse.matched_policy_ids || []
            setPolicyIds(matched_ids);

            const response = await fetch(`${window._env_?.VITE_FAST_API}/global_search`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    matched_policy_ids: matched_ids,
                    keyword: searchTerm,
                    tag: "Governance"
                })
            });

            const data = await response.json();

            if (data.filters && data.filters.length > 0) {
                const apiFilters = data.filters[0];
                const newFilterData = {};
                const newSelectedFilters = {};
                const newExpandedSections = {};

                Object.keys(apiFilters).forEach(key => {
                    if (apiFilters[key] && typeof apiFilters[key] === 'object') {
                        newFilterData[key] = Object.entries(apiFilters[key]).map(
                            ([name, data]) => ({
                                label: `${name} (${data.count})`,
                                name: name,
                                id: data.id,
                                count: data.count
                            })
                        );
                        newSelectedFilters[key] = [];
                        newExpandedSections[key] = false;
                    }
                });

                setFilterData(newFilterData);
                setSelectedFilters(newSelectedFilters);
                setExpandedSections(newExpandedSections);
            }

            setHasSearchedData(true);
            setIsModalOpen(true);
        } catch (error) {
            console.error('Error fetching filters:', error);
        } finally {
            setIsSearching(false);
            setIsFetchingFilters(false);
        }
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);

        if (hasSearchedData) {
            setHasSearchedData(false);
            setSearchResults([]);
            setShowResults(false);
            setFilterData({});
            setSelectedFilters({});
            setExpandedSections({});
            setNoDataFound(false);
            setSortBy('relevance');
        }
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const toggleFilter = (category, item) => {
        setSelectedFilters(prev => {
            const current = prev[category] || [];
            const isSelected = current.some(f => f.label === item.label);

            return {
                ...prev,
                [category]: isSelected
                    ? current.filter(i => i.label !== item.label)
                    : [...current, item]
            };
        });
    };

    const clearAllFilters = () => {
        const clearedFilters = {};
        Object.keys(filterData).forEach(key => {
            clearedFilters[key] = [];
        });
        setSelectedFilters(clearedFilters);
        setSearchResults([]);
        setShowResults(false);
        setNoDataFound(false);
        setSortBy('relevance');
    };

    const getSelectedCount = () => {
        return Object.values(selectedFilters).flat().length;
    };

    const handleApplyFilters = async () => {
        if (getSelectedCount() === 0) {
            return;
        }

        setIsFetchingResults(true);
        setShowResults(false);
        setNoDataFound(false);

        try {
            const set = [];
            Object.keys(selectedFilters).forEach(category => {
                selectedFilters[category].forEach(filter => {
                    set.push({
                        type: category,
                        name: filter.name.toLowerCase(),
                        id: filter.id
                    });
                });
            });

            const response = await fetch(`${window._env_?.VITE_FAST_API}/global_search/governance/filters`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    matched_policy_ids: policyIds,
                    set: set
                })
            });

            const data = await response.json();

            if (data.message === "No data found") {
                setNoDataFound(true);
                setSearchResults([]);
                setShowResults(false);
            } else if (data.results) {
                setSearchResults(data.results);
                setShowResults(true);
                setNoDataFound(false);
                setSortBy('relevance');
            }
        } catch (error) {
            console.error('Error fetching results:', error);
        } finally {
            setIsFetchingResults(false);
        }
    };

    const handleResultClick = (result) => {
        setIsModalOpen(false);

        if (result.type === 'table') {
            navigate('/datagovernance/data-catalogue/table', {
                state: {
                    type: "table",
                    table: result.table_name,
                    schemaName: result.schema_name,
                    connectionName: result.connection_name
                }
            });
        } else if (result.type === 'column') {
            navigate('/datagovernance/data-catalogue/column', {
                state: {
                    type: "column",
                    columnName: result.column_name,
                    tableName: result.table_name,
                    schemaName: result.schema_name,
                    connectionName: result.connection_name
                }
            });
        }
    };

    return (
        <>
            <div className="relative">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8e78b7] w-64 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    onKeyPress={(e) => e.key === 'Enter' && !isSearching && handleSearch()}
                    disabled={isSearching}
                />

                <button
                    onClick={() => {
                        if (hasSearchedData) {
                            setIsModalOpen(true);
                        } else {
                            handleSearch();
                        }
                    }}
                    disabled={!searchTerm.trim() || isSearching}
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-md transition-all ${searchTerm.trim() && !isSearching
                        ? 'bg-[#8e78b7] text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    {isSearching ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : hasSearchedData ? (
                        <ArrowRight size={16} />
                    ) : (
                        <Search size={16} />
                    )}
                </button>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white w-full h-full max-w-7xl max-h-[90vh] m-4 rounded-lg shadow-2xl flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center gap-4 flex-1">
                                <h2 className="text-xl font-semibold text-gray-900">Marketplace</h2>
                                {showResults && (
                                    <>
                                        <div className="text-sm text-gray-500">
                                            {searchResults.length} results
                                        </div>
                                        <div className="text-sm text-gray-400 flex items-center gap-2">
                                            Sort by 
                                            <select
                                                value={sortBy}
                                                onChange={(e) => setSortBy(e.target.value)}
                                                className="border border-gray-300 px-2 py-1 rounded text-gray-700 cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#8e78b7]"
                                            >
                                                <option value="relevance">Relevance</option>
                                                <option value="name-asc">Name (A-Z)</option>
                                                <option value="name-desc">Name (Z-A)</option>
                                                <option value="type">Type</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex flex-1 overflow-hidden">
                            <div className="w-80 border-r border-gray-200 bg-gray-50 flex flex-col">
                                {isFetchingFilters ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8e78b7] mx-auto mb-3"></div>
                                            <p className="text-sm text-gray-600">Loading filters...</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="p-4 flex-1 overflow-y-auto">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-semibold text-gray-900">Filters</h3>
                                                {getSelectedCount() > 0 && (
                                                    <button
                                                        onClick={clearAllFilters}
                                                        className="text-[#8e78b7] text-sm"
                                                    >
                                                        Clear all
                                                    </button>
                                                )}
                                            </div>

                                            {Object.keys(filterData).length === 0 ? (
                                                <div className="text-center text-gray-500 py-8">
                                                    <p className="text-sm">No filters available</p>
                                                </div>
                                            ) : (
                                                Object.keys(filterData).map((category) => {
                                                    if (!filterData[category] || filterData[category].length === 0) return null;

                                                    return (
                                                        <div key={category} className="mb-2">
                                                            <button
                                                                onClick={() => toggleSection(category)}
                                                                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                                                            >
                                                                <span className="capitalize">{category}</span>
                                                                <ChevronDown
                                                                    size={16}
                                                                    className={`transform transition-transform ${expandedSections[category] ? 'rotate-180' : ''
                                                                        }`}
                                                                />
                                                            </button>

                                                            {expandedSections[category] && (
                                                                <div className="mt-1 ml-2 space-y-1">
                                                                    {filterData[category].map((item) => (
                                                                        <label
                                                                            key={item.label}
                                                                            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer"
                                                                        >
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={selectedFilters[category]?.some(f => f.label === item.label) || false}
                                                                                onChange={() => toggleFilter(category, item)}
                                                                                className="mr-2 rounded border-gray-300 text-[#8e78b7] focus:ring-[#8e78b7]"
                                                                            />
                                                                            <span>{item.label}</span>
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>

                                        {getSelectedCount() > 0 && (
                                            <div className="p-4 border-t border-gray-200 bg-white">
                                                <button
                                                    onClick={handleApplyFilters}
                                                    disabled={isFetchingResults}
                                                    className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${isFetchingResults
                                                        ? 'bg-gray-400 text-white cursor-not-allowed'
                                                        : 'bg-[#8e78b7] text-white hover:bg-[#7d6ba0]'
                                                        }`}
                                                >
                                                    {isFetchingResults ? (
                                                        <span className="flex items-center justify-center">
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                            Loading...
                                                        </span>
                                                    ) : (
                                                        `Apply (${getSelectedCount()})`
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {!showResults && !isFetchingResults && !noDataFound ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center text-gray-500">
                                            <Search size={48} className="mx-auto mb-4 text-gray-300" />
                                            <p className="text-lg font-medium mb-2">Select filters to view results</p>
                                            <p className="text-sm">Choose from the options on the left and click "Apply"</p>
                                        </div>
                                    </div>
                                ) : isFetchingResults ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8e78b7] mx-auto mb-4"></div>
                                            <p className="text-gray-600">Fetching results...</p>
                                        </div>
                                    </div>
                                ) : noDataFound ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center text-gray-500">
                                            <Search size={48} className="mx-auto mb-4 text-gray-300" />
                                            <p className="text-lg font-medium mb-2">No data found</p>
                                            <p className="text-sm">Try adjusting your filters to see more results</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-6">
                                        <div className="space-y-4">
                                            {getSortedResults(searchResults).map((result, index) => (
                                                <div
                                                    key={index}
                                                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                                                    onClick={() => handleResultClick(result)}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                {result.type === 'table' ? (
                                                                    <Table size={18} className="text-blue-600" />
                                                                ) : (
                                                                    <Columns4 size={18} className="text-green-600" />
                                                                )}
                                                                <h3 className="font-semibold text-gray-900">
                                                                    {result.type === 'table'
                                                                        ? result.table_name
                                                                        : result.column_name}
                                                                </h3>
                                                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full capitalize">
                                                                    {result.type}
                                                                </span>
                                                            </div>
                                                            {result.description && (
                                                                <p className="text-sm text-gray-600 mb-2">
                                                                    {Array.isArray(result.description)
                                                                        ? result.description.join(', ')
                                                                        : result.description}
                                                                </p>
                                                            )}
                                                            <div className="space-y-1">
                                                                <p className="text-xs text-gray-500">
                                                                    <span className="font-medium">Connection:</span> {result.connection_name}.{result.schema_name}.{result.table_name}
                                                                    {result.type === 'column' && `.${result.column_name}`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <ArrowUpRight size={20} className="text-gray-400 hover:text-gray-600" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-end p-3 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-8 py-1 rounded-lg font-medium transition-colors bg-[#8e78b7] text-white hover:bg-[#7d6ba0]"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default GovernanceSearch;