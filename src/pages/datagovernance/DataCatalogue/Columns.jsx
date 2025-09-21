import React, { useState, useEffect } from "react";
import Breadcrumb from "../../../components/Breadcrumb";
import { Icon } from "@iconify-icon/react";
import { secureQuery, fetchConnectionDetails } from './Components/function.js';
import { useAuth } from "../../../context/AuthContext.jsx";
import { ChevronRight, ChevronLeft, Pencil, RefreshCcw, Search } from 'lucide-react';
import { flushSync } from 'react-dom';
import Edit from "./Edit.jsx";
import { useNavigate, useLocation } from "react-router-dom";


function Columns() {
    const { token, decodedToken } = useAuth();
    const isUserAuthorized = decodedToken?.resource_access?.darch?.roles?.some(role =>
        ['persona:data steward', 'persona:data owner'].includes(role?.toLowerCase())
    );
    const navigate = useNavigate();
    const { state: navigationState } = useLocation();

    const [loading, setLoading] = useState(true);
    const [columnData, setColumnData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [refresh, setRefresh] = useState(false);
    const [showEditPage, setShowEditPage] = useState(false);
    const [editColumnDetails, setEditColumnDetails] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState({ show: false, message: '', type: '' });
    const [allTablesRawData, setAllTablesRawData] = useState([]);

    const processColumnData = (data) => {
        return data.map(item => {
            return {
                conn_metadata_id: item.conn_metadata_id,
                id: `#${item.conn_metadata_id.substring(0, 4)}`,
                name: item.column_name || 'Unnamed',
                diagram: "Diagram_1",
                joins: "Joins",
            };
        });
    };

    const loadData = async (forceResfresh = false) => {
        if (columnData.length > 0 && !forceResfresh) {
            return;
        }
        setLoading(true);
        try {
            const secureQueryResponse = await secureQuery({
                user_query: "",
            }, token);

            const policyIds = secureQueryResponse.matched_policy_ids || [];

            const allColumnsData = await fetchConnectionDetails(policyIds, token);
            setAllTablesRawData(allColumnsData);
            return { success: true };
        } catch (error) {
            console.error('Error loading column data:', error);
            return { success: false, error };
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [token]);

    useEffect(() => {
        if (allTablesRawData.length > 0) {
            let dataToProcess = allTablesRawData;

            // If state is from a TABLE navigation
            if (
                navigationState?.type === 'table' &&
                navigationState?.tableName &&
                navigationState?.schemaName &&
                navigationState?.connectionName
            ) {
                dataToProcess = allTablesRawData.filter(item =>
                    item.table_name === navigationState.tableName &&
                    item.table_schema === navigationState.schemaName &&
                    item.connection_name === navigationState.connectionName
                );
            }
            // If state is from a SCHEMA navigation
            else if (
                navigationState?.type === 'schema' &&
                navigationState?.schemaName &&
                navigationState?.connectionName
            ) {
                dataToProcess = allTablesRawData.filter(item =>
                    item.table_schema === navigationState.schemaName &&
                    item.connection_name === navigationState.connectionName
                );
            }
            else if (navigationState?.type === 'database' && navigationState?.connectionName) {
                dataToProcess = allTablesRawData.filter(item =>
                    item.connection_name === navigationState.connectionName
                );
            }

            const processedData = processColumnData(dataToProcess);
            setColumnData(processedData);
        }
    }, [allTablesRawData, navigationState]);

    const handleRefresh = async () => {
        setSearchTerm("")
        setColumnData([])
        const result = await loadData(true);
        if (result.success) {
            setToast({
                show: true,
                message: 'Column data refreshed successfully',
                type: 'success'
            });
        } else {
            setToast({
                show: true,
                message: 'Failed to refresh column data',
                type: 'error'
            });
        }

        setTimeout(() => {
            setToast({ show: false, message: '', type: '' });
        }, 3000);
    };

    const [fetchingEditId, setFetchingEditId] = useState(null);
    const handleShowEditPage = async (column) => {
        setFetchingEditId(column.conn_metadata_id);
        try {
            const rawDataItem = allTablesRawData.find(
                item => item.conn_metadata_id === column.conn_metadata_id && item.column_name === column.name
            );

            if (!rawDataItem) {
                throw new Error("Could not find the detailed data for the selected column.");
            }

            const response = await fetch(`${window._env_?.VITE_FAST_API}/catalogue/column/prefill`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'accept': 'application/json'
                },
                body: JSON.stringify({
                    column: rawDataItem.column_name,
                    table_name: rawDataItem.table_name,
                    table_schema: rawDataItem.table_schema,
                    connection_name: rawDataItem.connection_name,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to fetch edit details for the column');
            }

            const prefillData = await response.json();

            const detailsToEdit = {
                connection_set: [{
                    column_name: rawDataItem.column_name,
                    table_name: rawDataItem.table_name,
                    table_schema: rawDataItem.table_schema,
                    connection_name: rawDataItem.connection_name,
                }],
                prefill: prefillData
            };

            setEditColumnDetails(detailsToEdit);
            setShowEditPage(true);

        } catch (error) {
            console.error('Error fetching pre-fill data for column:', error);
            setToast({
                show: true,
                message: error.message,
                type: 'error'
            });
            setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
        } finally {
            setFetchingEditId(null);
        }
    };


    const handlPageSize = (e) => {
        setPageSize(parseInt(e.target.value, 10));
        setCurrentPage(1); // Reset to first page when page size changes
    }

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to the first page on a new search
    };

    const filteredItems = columnData.filter(column =>
        column.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const itemsPerPage = pageSize;
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem)

    const handlePageForward = (nextPage) => {
        setCurrentPage(nextPage)
    }

    const handlePageBackward = (prevPage) => {
        setCurrentPage(prevPage)
    }

    useEffect(() => {
        if (showEditPage) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [showEditPage]);

    const handleNavigate = (column) => {
        const selectedColumnRawData = allTablesRawData.find(
            item => item.conn_metadata_id === column.conn_metadata_id && item.column_name === column.name
        );
        if (selectedColumnRawData) {
            navigate(`/datagovernance/data-catalogue/column/${column.name}`, {
                state: { columnDetails: selectedColumnRawData }
            });
        } else {
            console.error("Raw data could not be found.");
        }
    };

    return (
        <div className="p-5">
            {/* Toast notification */}
            {toast.show && (
                <div className={`fixed top-6 right-6 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 animate-fadeIn ${toast.type === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-500' :
                    'bg-red-100 text-red-800 border-l-4 border-red-500'
                    }`}>
                    <Icon
                        icon={toast.type === 'success' ? 'mdi:check-circle' : 'mdi:alert-circle'}
                        className="h-5 w-5"
                    />
                    <p>{toast.message}</p>
                    <button
                        onClick={() => setToast({ show: false, message: '', type: '' })}
                        className="ml-2 text-gray-500 hover:text-gray-700"
                    >
                        <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="currentColor" d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                </div>
            )}
            <Breadcrumb />
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Column</h1>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search by Column Name"
                            className="pl-10 pr-4 py-2 w-[300px] border border-gray-300 rounded-lg focus:outline-none"
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                    <button
                        title="Refresh"
                        onClick={handleRefresh}
                        disabled={loading}
                        className="text-black border border-gray-300 shadow-lg hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-3 py-2.5 me-2 dark:bg-[#ffffff] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
                    >
                        <RefreshCcw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-40">
                    <p>Loading data...</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden mt-5 text-sm">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[#29304a] text-white">
                                <th className="text-left p-4">ID</th>
                                <th className="text-left p-4">Name</th>
                                <th className="text-left p-4">Diagram</th>
                                <th className="text-left p-4">Joins</th>
                                {isUserAuthorized && (
                                    <th className="text-left p-4">Action</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.length > 0 ? currentItems.map((column, index) => (
                                <tr key={index} className="border-b text-gray-500">
                                    <td className="p-4">{indexOfFirstItem + index + 1}</td>
                                    <td className="p-4 text-blue-600 underline cursor-pointer"
                                        onClick={() => handleNavigate(column)}>
                                        {column.name}
                                    </td>
                                    <td className="p-4">{column.diagram}</td>
                                    <td className="p-4">{column.joins}</td>
                                    {isUserAuthorized && (
                                        <td
                                            title="Link Business Definition to Column"
                                            onClick={() => { handleShowEditPage(column) }}
                                            className="p-4 cursor-pointer">
                                            <Pencil className="w-4 h-4" />
                                        </td>
                                    )}
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={isUserAuthorized ? 5 : 4} className="p-4 text-center">No column data available</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* pagination details */}
            {currentItems.length > 0 && (
                <div className="pt-3 flex justify-between items-center text-sm text-gray-500">
                    <div>
                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredItems.length)} of {filteredItems.length} Entries
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            title="Back"
                            disabled={currentPage === 1}
                            onClick={() => handlePageBackward(currentPage - 1)}
                            className="p-1 rounded hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="font-medium text-gray-600">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            title="Next"
                            disabled={currentPage === totalPages}
                            onClick={() => handlePageForward(currentPage + 1)}
                            className="p-1 rounded hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}


            {/* Edit page */}
            {showEditPage && (
                <div className="fixed inset-0 z-50 flex">
                    <div
                        className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm"
                        onClick={() => setShowEditPage(false)}
                    />

                    <div
                        className="relative ml-auto w-full sm:w-[400px] h-full bg-white shadow-xl z-50 animate-slide-in">
                        <Edit
                            onClose={() => {
                                setEditColumnDetails({})
                                setShowEditPage(false)
                            }}
                            editDetails={editColumnDetails}
                            type="column"
                        />
                    </div>
                </div>
            )}

        </div>
    );
}

export default Columns;