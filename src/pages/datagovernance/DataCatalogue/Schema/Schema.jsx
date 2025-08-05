import React, { useState, useEffect } from "react";
import Breadcrumb from "../../../../components/Breadcrumb.jsx";
import { Icon } from "@iconify-icon/react";
import { secureQuery, fetchConnectionDetails } from '../Components/function.js';
import { useAuth } from "../../../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import SchemaViewScreen from "../Schema/SchemaViewScreen.jsx"
import { Search } from 'lucide-react';

function Schema() {
  const [loading, setLoading] = useState(true);
  const [schemaData, setSchemaData] = useState([]);
  const [schemaViewScreen, setSchemaViewScreen] = useState(false);
  const [schemaForViewScreen, setSchemaForViewScreen] = useState(null);
  const [columnDataPopup, setColumnDataPopup] = useState(false);
  const [columnData, setColumnData] = useState(null);
  const [value, setValue] = useState("")

  const { token } = useAuth();
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
  const navigate = useNavigate();
  const PREFIX = '/datagovernance/data-catalogue';

  const processSchemaData = (data) => {
    // Group by schema
    const schemaMap = new Map();

    data.forEach(item => {
      // Unique key for schema
      const schemaKey = `${item.connection_id}_${item.table_schema}`;
      console.log("item inside processSchemaData ", item)

      if (!schemaMap.has(schemaKey)) {
        schemaMap.set(schemaKey, {
          id: `#${item.conn_metadata_id.substring(0, 4)}`,
          connectionName: item.connection_name,
          // description: 'Schema from ' + item.connection_type,
          schema: item.table_schema,
          description: 'schema description',
          database: item.connection_type,
          owner: item.created_by || 'System',
          tables: 0,
          views: 0,
          columns: 0,
          CreatedDate: new Date(item.created_at).toLocaleDateString(),
          lastUpdated: new Date(item.updated_at).toLocaleDateString(),
          tableSet: new Set(),
          viewSet: new Set(),
          columnSet: new Set()
        });
      }


      const entry = schemaMap.get(schemaKey);

      // Count tables
      const tableKey = `${item.table_schema}_${item.table_name}`;
      if (!entry.tableSet.has(tableKey)) {
        entry.tableSet.add(tableKey);
        entry.tables = entry.tableSet.size;
      }

      //Count columns
      const columnKey = `${item.table_schema}_${item.column_name}`;
      if(!entry.columnSet.has(columnKey)) {
        entry.columnSet.add(columnKey);
        entry.columns = entry.columnSet.size;
      }
    });


    // Convert map to array and format the counts
    return Array.from(schemaMap.values()).map(item => ({
      ...item,
      tables: item.tables.toString().padStart(2, '0'),
      views: item.views.toString().padStart(2, '0'),
      columns: item.columns.toString().padStart(2, '0')
    }));
  };

  // Refactored loadData to return result for toast
  const loadData = async () => {
    setLoading(true);
    try {
      const secureQueryResponse = await secureQuery({
        user_query: "",
      }, token);

      const policyIds = secureQueryResponse.matched_policy_ids || [];

      const allSchemasData = await fetchConnectionDetails(policyIds, token);

      const processedData = processSchemaData(allSchemasData);
      console.log("processedData ", processedData)
      setSchemaData(processedData);
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

  // Refresh handler with toast
  const handleRefresh = async () => {
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
    console.log("schema ", schema)
    setSchemaForViewScreen(schema)
    setSchemaViewScreen(true)
  }

  const handleColumnDataPopup = (schema) => {
    console.log("schema inside handleColumnDataPopup", schema)
    setColumnData(schema);
    setColumnDataPopup(true);
  }

  return (
    <div className="p-5">
      {/* Toast notification */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 animate-fadeIn ${
          toast.type === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-500' :
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
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="currentColor" d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      )}
      <Breadcrumb/>
      {schemaViewScreen ? (
        <SchemaViewScreen schema={schemaForViewScreen}/>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Schema</h1>
            <div className="flex items-center gap-2">
              <div className="relative w-52">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  value={value}
                  placeholder="Search schema"
                  onChange={(e) => setValue(e.target.value)}
                  className="border rounded-lg text-sm text-gray-500 p-2 pl-8 w-full"
                />
              </div>
              <button
                className="p-0.5 w-10 h-9 rounded-lg border border-gray-400 hover:bg-gray-50 disabled:opacity-50"
                onClick={handleRefresh}
                disabled={loading}
              >
                <Icon
                  icon="material-symbols:autorenew-rounded"
                  width="24"
                  height="24"
                  className={`text-gray-600 pt-0.5 ${loading ? "animate-spin" : ""}`}
                />
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
                    <th className="text-left p-4">Database</th>
                    <th className="text-left p-4">Name</th>
                    <th className="text-left p-4">Description</th>
                    <th className="text-left p-4">Owner</th>
                    <th className="text-left p-4">Tables</th>
                    <th className="text-left p-4">Columns</th>
                    <th className="text-left p-4">Created Date</th>
                    <th className="text-left p-4">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(schemaData) && schemaData.length > 0 ? (
                    schemaData.map((schema, index) => (
                      <tr
                        key={schema?.connectionName ?? index}
                        className="border-b"
                      >
                        <td className="p-4">{index + 1}</td>
                        <td className="p-4">{schema.database}</td>
                        <td
                          onClick={() => {
                            handleSchemaViewScreen(schema);
                          }}
                          className="p-4 underline underline-offset-4 text-blue-600 cursor-pointer"
                        >
                          {schema.schema}
                        </td>
                        <td className="p-4">{schema.description}</td>
                        {/* <td className="p-4">{schema.database}</td> */}
                        <td className="p-4">{schema.owner}</td>
                        <td className="p-4 underline underline-offset-4 text-blue-600">
                          {schema.tables}
                        </td>
                        <td 
                          onClick={() => handleColumnDataPopup(schema)}
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
          )}

          {columnDataPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div 
              className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
              onClick={() => setColumnDataPopup(false)}
            ></div>
          
            <div className="relative bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 ease-out">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-semibold text-gray-900">Column Details</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Active</span>
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

            </div>
          </div>
          )}
        </>
      )}
    </div>
  );
}

export default Schema;