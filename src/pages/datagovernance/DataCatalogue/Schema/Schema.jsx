import React, { useState, useEffect } from "react";
import Breadcrumb from "../../../../components/Breadcrumb.jsx";
import { Icon } from "@iconify-icon/react";
import { secureQuery, fetchConnectionDetails } from '../Components/function.js';
import { useAuth } from "../../../../context/AuthContext.jsx";
import SchemaViewScreen from "../Schema/SchemaViewScreen.jsx"
import { Search, Database, Columns3, RefreshCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from "react-router-dom";

function Schema() {
  const [loading, setLoading] = useState(true);
  const [schemaData, setSchemaData] = useState([]);
  const [schemaViewScreen, setSchemaViewScreen] = useState(false);
  const [schemaForViewScreen, setSchemaForViewScreen] = useState(null);
  const [columnDataPopup, setColumnDataPopup] = useState(false);
  const [tableDataPopup, setTableDataPopup] = useState(false)
  const [columnData, setColumnData] = useState({});
  const [columnId, setColumnId] = useState("")
  const [tableData, setTableData] = useState({});
  const [tableId, setTableId] = useState("")
  const [currentSchema, setCurrentSchema] = useState(null)
  const [value, setValue] = useState("")

  const { token } = useAuth();
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const navigate = useNavigate();
  const { state: navigationState } = useLocation();
  const [allRawData, setAllRawData] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const processSchemaData = (data) => {
    // Group by schema
    const schemaMap = new Map();
    const columnDataMap = {};
    const tableDataMap = {};

    data.forEach(item => {
      // Unique key for schema
      const schemaKey = `${item.connection_id}_${item.table_schema}`;

      if (!schemaMap.has(schemaKey)) {
        schemaMap.set(schemaKey, {
          id: `#${item.conn_metadata_id.substring(0, 4)}`,
          connectionName: item.connection_name,
          schema: item.table_schema,
          description: item.table_schema_description || 'schema description',
          database: item.connection_type,
          owner: item.created_by || 'System',
          tables: 0,
          views: 0,
          columns: 0,
          CreatedDate: new Date(item.created_at).toLocaleDateString(),
          lastUpdated: new Date(item.updated_at).toLocaleDateString(),
          tableSet: new Set(),
        });
      }

      const entry = schemaMap.get(schemaKey);
      const groupKey = `${item.connection_name}_${item.table_schema}`;

      // Count unique tables
      const tableKey = `${item.table_schema}_${item.table_name}`;
      if (!entry.tableSet.has(tableKey)) {
        entry.tableSet.add(tableKey);
        entry.tables = entry.tableSet.size;

        if (!tableDataMap[groupKey]) {
          tableDataMap[groupKey] = [];
        }
        tableDataMap[groupKey].push({
          table_name: item.table_name,
          description: "table description",
          database: item.connection_type,
          schema: item.table_schema,
          owner: item.created_by,
        });
      }

      entry.columns++;

      if (!columnDataMap[groupKey]) {
        columnDataMap[groupKey] = [];
      }
      columnDataMap[groupKey].push({
        column_name: item.column_name,
        column_metadata: item.column_metadata,
      });
    });

    setColumnData(columnDataMap);
    setTableData(tableDataMap);

    return Array.from(schemaMap.values()).map(item => ({
      ...item,
      tables: item.tables.toString().padStart(2, '0'),
      views: item.views.toString().padStart(2, '0'),
      columns: item.columns.toString().padStart(2, '0')
    }));
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const secureQueryResponse = await secureQuery({ user_query: "" }, token);
      const policyIds = secureQueryResponse.matched_policy_ids || [];
      const allSchemasData = await fetchConnectionDetails(policyIds, token);
      setAllRawData(allSchemasData);
      return { success: true };
    } catch (error) {
      console.error('Error loading schema data:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  useEffect(() => {
    if (allRawData.length > 0) {
      let dataToProcess = allRawData;

      if (navigationState?.type === 'database' && navigationState?.connectionName) {
        dataToProcess = allRawData.filter(item => item.connection_name?.toLowerCase() === navigationState.connectionName?.toLowerCase());
      }
      else if (
        navigationState?.type === 'schema' && navigationState?.schemaName && navigationState?.connectionName
      ) {
        dataToProcess = allRawData.filter(item => item.connection_name?.toLowerCase() === navigationState.connectionName?.toLowerCase() &&
          item.table_schema?.toLowerCase() === navigationState.schemaName?.toLowerCase()
        );
      }

      const processedData = processSchemaData(dataToProcess);
      setSchemaData(processedData);
    }
  }, [allRawData, navigationState]);
  const handleRefresh = async () => {
    setValue('');
    const result = await loadData();
    if (result.success) {
      setToast({
        show: true,
        message: 'Schema data refreshed successfully',
        type: 'success'
      });
    } else {
      setToast({
        show: true,
        message: 'Failed to refresh schema data',
        type: 'error'
      });
    }
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleSchemaViewScreen = (schema) => {
    navigate(`/datagovernance/data-catalogue/schema/${schema.schema}`, {
      state: { schemaData: schema }
    });
  };

  const handleNavigateToTables = (schema) => {
    navigate('/datagovernance/data-catalogue/table', {
      state: {
        type: 'schema',
        schemaName: schema.schema,
        connectionName: schema.connectionName,
      }
    });
  };

  const handleNavigateToColumns = (schema) => {
    navigate('/datagovernance/data-catalogue/column', {
      state: {
        type: 'schema',
        schemaName: schema.schema,
        connectionName: schema.connectionName,
      }
    });
  };

  const handleSearchChange = (e) => {
    setValue(e.target.value);
    setCurrentPage(1);
  };

  const filteredSchemaData = schemaData.filter((schema) =>
    schema.schema.toLowerCase().includes(value.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSchemaData = filteredSchemaData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSchemaData.length / itemsPerPage);

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
      {
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Schema</h1>
            <div className="flex items-center gap-2">
              <div className="relative w-52">
                <input
                  value={value}
                  placeholder="Search schema ..."
                  onChange={handleSearchChange}
                  className="pl-10 border rounded-lg text-sm text-gray-500 p-2 w-full"
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#29304a] text-white">
                      <th className="text-left p-4">Id</th>
                      <th className="text-left p-4">Name</th>
                      <th className="text-left p-4">Description</th>
                      <th className="text-left p-4">Database</th>
                      <th className="text-left p-4">Owner</th>
                      <th className="text-left p-4">Tables</th>
                      <th className="text-left p-4">Columns</th>
                      <th className="text-left p-4">Created Date</th>
                      <th className="text-left p-4">Last Updated Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(currentSchemaData) && currentSchemaData.length > 0 ? (
                      currentSchemaData.map((schema, index) => (
                        <tr
                          key={schema?.connectionName + schema.schema}
                          className="border-b"
                        >
                          <td className="p-4">{indexOfFirstItem + index + 1}</td>
                          <td
                            onClick={() => {
                              handleSchemaViewScreen(schema);
                            }}
                            className="p-4 underline underline-offset-4 text-blue-600 cursor-pointer"
                          >
                            {schema.schema}
                          </td>
                          <td className="p-4 max-w-xs truncate whitespace-nowrap">{schema.description}</td>
                          <td className="p-4 max-w-xs truncate whitespace-nowrap">{schema.connectionName}</td>
                          <td className="p-4">{schema.owner}</td>
                          <td
                            onClick={() => handleNavigateToTables(schema)}
                            className="p-4 underline underline-offset-4 text-blue-600 cursor-pointer">
                            {schema.tables}
                          </td>
                          <td
                            onClick={() => handleNavigateToColumns(schema)}
                            className="p-4 underline underline-offset-4 cursor-pointer text-blue-600">
                            {schema.columns}
                          </td>
                          <td className="p-4">{schema.CreatedDate}</td>
                          <td className="p-4">{schema.lastUpdated}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="p-4 text-center">
                          No schema data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center px-4 py-3 border-t">
                <span className="text-sm text-gray-600">
                  Showing {filteredSchemaData.length > 0 ? indexOfFirstItem + 1 : 0} to {Math.min(indexOfLastItem, filteredSchemaData.length)} of {filteredSchemaData.length} Entries
                </span>
                <div className="flex items-center gap-1">
                  <button
                    title="Back"
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
                    title="Next"
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

          {columnDataPopup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div
                className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
                onClick={() => setColumnDataPopup(false)}
              ></div>

              <div className="relative h-[500px] bg-white rounded-lg shadow-2xl mx-4 w-full max-w-5xl transform transition-all duration-300 ease-out flex flex-col max-h-[90vh]">

                <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                  <div className="flex items-center">
                    <span className="pr-1 text-[#8d77ba]"><Columns3 /></span>
                    <span className="text-lg font-semibold text-gray-900 pr-3">Column Details:</span>
                    <span className="text-md">{currentSchema.schema}</span>
                  </div>
                  <button
                    onClick={() => setColumnDataPopup(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 px-7 h-[400px]">
                  <table className="min-w-full text-sm text-left border border-gray-200 rounded-lg">
                    <thead className="bg-[#262B46] text-white uppercase text-xs sticky top-0 z-20">
                      <tr>
                        <th className="px-4 py-3 font-medium bg-[#262B46]">Column name</th>
                        <th className="px-4 py-3 font-medium bg-[#262B46]">Data type</th>
                        <th className="px-4 py-3 font-medium bg-[#262B46]">Length</th>
                        <th className="px-4 py-3 font-medium bg-[#262B46]">Precision</th>
                        <th className="px-4 py-3 font-medium bg-[#262B46]">Scale</th>
                        <th className="px-4 py-3 font-medium bg-[#262B46]">Nullable</th>
                      </tr>
                    </thead>
                    <tbody className="text-[#262B46] bg-white">
                      {columnData[columnId].map((column) => {
                        const meta = column.column_metadata;
                        return (
                          <tr key={column.column_name} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2">{column.column_name}</td>
                            <td className="px-4 py-2">{meta.DATA_TYPE}</td>
                            <td className="px-4 py-2">{meta.DATA_LENGTH}</td>
                            <td className="px-4 py-2">{meta.DATA_PRECISION}</td>
                            <td className="px-4 py-2">{meta.DATA_SCALE}</td>
                            <td className="px-4 py-2">{meta.is_nullable === 'N' ? 'No' : 'Yes'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 border-t border-gray-200 flex justify-end bg-white sticky bottom-0 z-10">
                  <button
                    onClick={() => setColumnDataPopup(false)}
                    className="px-4 py-2 text-white bg-[#8d77ba] rounded-md hover:bg-[#7a66a8] transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {tableDataPopup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div
                className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
                onClick={() => setTableDataPopup(false)}
              ></div>

              <div className="relative h-[500px] bg-white rounded-lg shadow-2xl mx-4 w-full max-w-5xl transform transition-all duration-300 ease-out flex flex-col max-h-[90vh]">

                <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                  <div className="flex items-center">
                    <span className="pr-1 text-[#8d77ba]"><Database /></span>
                    <span className="text-lg font-semibold text-gray-900 pr-3"> Schema Details:</span>
                    <span className="text-md">{currentSchema.schema}</span>
                  </div>
                  <button
                    onClick={() => setTableDataPopup(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 px-7">
                  <table className="min-w-full text-sm text-left border border-gray-200 rounded-lg">
                    <thead className="bg-[#262B46] text-white uppercase text-xs sticky top-0 z-20">
                      <tr>
                        <th className="px-4 py-3 font-medium bg-[#262B46]">Table name</th>
                        <th className="px-4 py-3 font-medium bg-[#262B46]">Description</th>
                        <th className="px-4 py-3 font-medium bg-[#262B46]">Database</th>
                        <th className="px-4 py-3 font-medium bg-[#262B46]">Schema</th>
                        <th className="px-4 py-3 font-medium bg-[#262B46]">Owner</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData[tableId].map((table) => {
                        return (
                          <tr className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2">{table.table_name}</td>
                            <td className="px-4 py-2">{table.description}</td>
                            <td className="px-4 py-2">{table.database}</td>
                            <td className="px-4 py-2">{table.schema}</td>
                            <td className="px-4 py-2">{table.owner}</td>
                          </tr>
                        )
                      }
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 border-t border-gray-200 flex justify-end bg-white sticky bottom-0 z-10">
                  <button
                    onClick={() => setTableDataPopup(false)}
                    className="px-4 py-2 text-white bg-[#8d77ba] rounded-md hover:bg-[#7a66a8] transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

        </>
      }
    </div>
  );
}

export default Schema;