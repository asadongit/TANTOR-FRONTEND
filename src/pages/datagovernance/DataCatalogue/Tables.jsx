import React, { useState, useEffect } from "react";
import Breadcrumb from "../../../components/Breadcrumb";
import { Icon } from "@iconify-icon/react";
import { Search, RefreshCcw, ChevronLeft, ChevronRight, Pencil, Table, X, Loader2 } from 'lucide-react';
import { secureQuery, fetchConnectionDetails } from './Components/function.js';
import { useAuth } from "../../../context/AuthContext.jsx";
import Edit from "./Edit.jsx";
import { useLocation, useNavigate } from "react-router-dom";

function Tables() {
  const { token, decodedToken } = useAuth();
  const isUserAuthorized = decodedToken?.resource_access?.darch?.roles?.some(role =>
    ['data steward', 'data owner'].includes(role?.toLowerCase())
  );
  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [selectedTable, setSelectedTable] = useState(null);
  const [allTablesRawData, setAllTablesRawData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditPage, setShowEditPage] = useState(false);
  const [editDetails, setEditDetails] = useState({});

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [fetchingEditId, setFetchingEditId] = useState(null);
  const navigate = useNavigate();
  const { state: navigationState } = useLocation();
  console.log("states in tables are ### ",navigationState)

  // --- NEW STATE FOR COLUMN DETAILS MODAL ---
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [currentColumns, setCurrentColumns] = useState([]);

  const processTableData = (data) => {
    const tableMap = new Map();

    data.forEach(item => {
      const tableKey = `${item.connection_id}_${item.table_schema}_${item.table_name}`;

      if (!tableMap.has(tableKey)) {
        tableMap.set(tableKey, {
          id: `#${item.conn_metadata_id.substring(0, 8)}`,
          name: item.table_name,
          description: item.table_description || 'Table description',
          schema: item.table_schema,
          database: item.connection_type,
          connection_name: item.connection_name,
          owner: item.created_by || 'System',
          column: 0,
          CreatedDate: new Date(item.created_at).toLocaleDateString(),
          lastUpdated: new Date(item.updated_at).toLocaleDateString(),
          selected: false
        });
      }

      const entry = tableMap.get(tableKey);
      entry.column++;
    });

    return Array.from(tableMap.values()).map(item => ({
      ...item,
      column: item.column.toString().padStart(2, '0')
    }));
  };

  const getTags = (connectionType) => {
    const tags = ['Sensitive', 'Critical', 'Internal', 'Public', 'Confidential'];
    const index = Math.floor(Math.random() * tags.length);
    return tags[index];
  };

  const getTableColumns = (table) => {
    if (!table) return [];
    return allTablesRawData.filter(
      item =>
        item.table_name === table.name &&
        item.table_schema === table.schema &&
        item.connection_type === table.database
    );
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const secureQueryResponse = await secureQuery({ user_query: "" }, token);
      const policyIds = secureQueryResponse.matched_policy_ids || [];
      const allTablesData = await fetchConnectionDetails(policyIds, token);
      // --- MODIFICATION: Set raw data only. Processing is moved to useEffect.
      setAllTablesRawData(allTablesData);
      return { success: true };
    } catch (error) {
      console.error('Error loading table data:', error);
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
      
      // If navigated from Schema page, filter tables by schema name
      if (
        navigationState?.type === 'schema' &&
        navigationState?.schemaName &&
        navigationState?.connectionName
      ) {
        dataToProcess = allTablesRawData.filter(item =>
          item.table_schema === navigationState.schemaName &&
          item.connection_name === navigationState.connectionName
        );
      }
      // NEW: If navigated from Database page, filter by connection name
      else if (navigationState?.type === 'database' && navigationState?.connectionName) {
        dataToProcess = allTablesRawData.filter(item => 
          item.connection_name === navigationState.connectionName
        );
      }
      
      const processedData = processTableData(dataToProcess);
      setTableData(processedData);
    }
  }, [allTablesRawData, navigationState]);

  useEffect(() => {
    loadData();
  }, [token]);

  const handleRefresh = async () => {
    const result = await loadData();
    if (result.success) {
      setToast({ show: true, message: 'Table data refreshed successfully', type: 'success' });
    } else {
      setToast({ show: true, message: 'Failed to refresh table data', type: 'error' });
    }
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const filteredTableData = tableData.filter(table =>
    table?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    table?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    table?.schema?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    table?.database?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    table?.owner?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTableData = filteredTableData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTableData.length / itemsPerPage);

  const handleShowEditPage = async (table) => {
    setFetchingEditId(table.id);
    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/catalogue/table/prefill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
        body: JSON.stringify({
          table_name: table.name,
          table_schema: table.schema,
          connection_name: table.connection_name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch edit details');
      }

      const prefillData = await response.json();
      const detailsToEdit = {
        connection_set: [{
          table_name: table.name,
          table_schema: table.schema,
          connection_name: table.connection_name,
        }],
        prefill: prefillData
      };
      setEditDetails(detailsToEdit);
      setShowEditPage(true);
    } catch (error) {
      console.error('Error fetching pre-fill data:', error);
      setToast({ show: true, message: error.message, type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
    } finally {
      setFetchingEditId(null);
    }
  };

  const handleNavigateToTableDetails = (table) => {
    const columns = getTableColumns(table);
    navigate(`/datagovernance/data-catalogue/table/${table.name}`, {
      state: { tableData: table, columns: columns }
    });
  };

  const handleColumnClick = (table) => {
    navigate('/datagovernance/data-catalogue/column', {
      state: {
        type: 'table',
        tableName: table.name,
        schemaName: table.schema,
        connectionName: table.connection_name,
      }
    });
  };

  return (
    <div className="p-4">
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 animate-fadeIn ${toast.type === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-500' :
          'bg-red-100 text-red-800 border-l-4 border-red-500'
          }`}>
          <Icon
            icon={toast.type === 'success' ? 'mdi:check-circle' : 'mdi:alert-circle'}
            className="h-5 w-5"
          />
          <p>{toast.message}</p>
          <button onClick={() => setToast({ show: false, message: '', type: '' })} className="ml-2 text-gray-500 hover:text-gray-700">
            <Icon icon="mdi:close" className="h-4 w-4" />
          </button>
        </div>
      )}

      <Breadcrumb />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold ml-2">Table</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search Tables"
              className="pl-10 pr-4 py-2 w-[300px] border border-gray-300 rounded-lg focus:outline-none"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <button
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
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <p className="ml-2">Loading data...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden mt-5">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#29304a] text-white">
                  <th className="text-left px-4 py-2">Id</th>
                  <th className="text-left px-4 py-2">Name</th>
                  <th className="text-left px-4 py-2">Alias</th>
                  <th className="text-left px-4 py-2">Description</th>
                  <th className="text-left px-4 py-2">Database</th>
                  <th className="text-left px-4 py-2">Schema</th>
                  <th className="text-left px-4 py-2">Owner</th>
                  <th className="text-left px-4 py-2">Columns</th>
                  {/* <th className="text-left px-4 py-2">Tags</th> */}
                  <th className="text-left px-4 py-2">Created Date</th>
                  <th className="text-left px-4 py-2">Last Updated Date</th>
                  {isUserAuthorized && (
                    <th className="text-left px-4 whitespace-nowrap py-2">Action</th>
                  )}
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {currentTableData.length > 0 ? currentTableData.map((table, index) => (
                  <tr key={table.id} className="border-b hover:bg-gray-50 text-sm">
                    <td className="p-4">{indexOfFirstItem + index + 1}</td>
                    <td className="p-4 text-blue-600 underline cursor-pointer" onClick={() => handleNavigateToTableDetails(table)}>
                      {table.name}
                    </td>
                    <td className="p-4 max-w-xs truncate tooltip">{table.name}</td>
                    <td className="p-4 max-w-xs truncate tooltip">{table.description}</td>
                    <td className="p-4">{table.database}</td>
                    <td className="p-4">{table.schema}</td>
                    <td className="p-4">{table.owner}</td>
                    {/* --- MODIFIED: Added onClick handler to the columns cell --- */}
                     <td className="p-4 text-blue-600 underline cursor-pointer" onClick={() => handleColumnClick(table)}>
                      {table.column}
                    </td>
                    {/* <td className="p-4">critical</td> */}
                    <td className="p-4">{table.CreatedDate}</td>
                    <td className="p-4">{table.lastUpdated}</td>
                    {isUserAuthorized && (
                      <td className="px-6 p-4 text-center whitespace-nowrap">
                        <button
                          className="p-1.5 rounded-full hover:bg-gray-100 cursor-pointer disabled:cursor-wait"
                          onClick={() => handleShowEditPage(table)}
                          disabled={fetchingEditId === table.id}
                        >
                          {fetchingEditId === table.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
                        </button>
                      </td>
                    )}
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="12" className="p-4 text-center">No table data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center px-4 py-3 border-t">
            <span className="text-sm text-gray-600">
              Showing {filteredTableData.length > 0 ? indexOfFirstItem + 1 : 0} to {Math.min(indexOfLastItem, filteredTableData.length)} of {filteredTableData.length} Entries
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg disabled:text-gray-300 disabled:cursor-not-allowed text-gray-600 hover:bg-gray-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages > 0 ? totalPages : 1}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2 rounded-lg disabled:text-gray-300 disabled:cursor-not-allowed text-gray-600 hover:bg-gray-100"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
      {showEditPage && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm" onClick={() => setShowEditPage(false)} />
          <div className="relative ml-auto w-full sm:w-[400px] h-full bg-white shadow-xl z-50 animate-slide-in">
            <Edit
              onClose={() => {
                setEditDetails({});
                setShowEditPage(false);
              }}
              editDetails={editDetails}
              type="table"
            />
          </div>
        </div>
      )}

      {/* --- NEW: JSX for the Column Details Modal --- */}
      {isColumnModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center animate-fadeIn">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsColumnModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col m-4">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold text-gray-800">
                Column Details: <span className="font-bold text-[#29304a]">{selectedTable?.name}</span>
              </h2>
              <button
                onClick={() => setIsColumnModalOpen(false)}
                className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <table className="w-full text-sm text-left text-gray-700">
                <thead className="text-xs text-white uppercase bg-[#29304a] sticky top-0">
                  <tr>
                    <th scope="col" className="px-6 py-3">Column Name</th>
                    <th scope="col" className="px-6 py-3">Data Type</th>
                    <th scope="col" className="px-6 py-3">Length</th>
                    <th scope="col" className="px-6 py-3">Precision</th>
                    <th scope="col" className="px-6 py-3">Scale</th>
                    <th scope="col" className="px-6 py-3">Nullable</th>
                  </tr>
                </thead>
                <tbody>
                  {currentColumns.length > 0 ? currentColumns.map((col, index) => (
                    <tr key={index} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{col.column_name}</td>
                      <td className="px-6 py-4">{col.column_metadata?.DATA_TYPE || 'N/A'}</td>
                      <td className="px-6 py-4">{col.column_metadata?.DATA_LENGTH ?? 'N/A'}</td>
                      <td className="px-6 py-4">{col.column_metadata?.DATA_PRECISION ?? 'N/A'}</td>
                      <td className="px-6 py-4">{col.column_metadata?.DATA_SCALE ?? 'N/A'}</td>
                      <td className="px-6 py-4">{col.column_metadata?.is_nullable === 'N' ? 'No' : 'Yes'}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" className="text-center py-10">No column details found for this table.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end items-center p-4 border-t sticky bottom-0 bg-white z-10">
              <button
                onClick={() => setIsColumnModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Tables;