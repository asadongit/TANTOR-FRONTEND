import React, { useState, useEffect } from "react";
import Breadcrumb from "../../../components/Breadcrumb";
import { Icon } from "@iconify-icon/react";
import { secureQuery } from './Components/function.js';
import { useAuth } from "../../../context/AuthContext.jsx";

function Schema() {
  const [loading, setLoading] = useState(true);
  const [schemaData, setSchemaData] = useState([]);
  const { token } = useAuth();
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const fetchSchemaDetails = async (policyId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_FAST_API}/connection_details/${policyId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error(`Error fetching schema details for policy ${policyId}:`, error);
      return [];
    }
  };

  const processSchemaData = (data) => {
    // Group by schema
    const schemaMap = new Map();

    data.forEach(item => {
      // Unique key for schema
      const schemaKey = `${item.connection_id}_${item.table_schema}`;

      if (!schemaMap.has(schemaKey)) {
        schemaMap.set(schemaKey, {
          id: `#${item.conn_metadata_id.substring(0, 4)}`,
          connectionName: item.connection_name,
          description: 'Schema from ' + item.connection_type,
          database: item.connection_type,
          owner: item.created_by || 'System',
          tables: 0,
          views: 0,
          CreatedDate: new Date(item.created_at).toLocaleDateString(),
          lastUpdated: new Date(item.updated_at).toLocaleDateString(),
          tableSet: new Set(),
          viewSet: new Set()
        });
      }

      const entry = schemaMap.get(schemaKey);

      // Count tables
      const tableKey = `${item.table_schema}_${item.table_name}`;
      if (!entry.tableSet.has(tableKey)) {
        entry.tableSet.add(tableKey);
        entry.tables = entry.tableSet.size;
      }
    });

    // Convert map to array and format the counts
    return Array.from(schemaMap.values()).map(item => ({
      ...item,
      tables: item.tables.toString().padStart(2, '0'),
      views: item.views.toString().padStart(2, '0')
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

      const allSchemasPromises = policyIds.map(id => fetchSchemaDetails(id));
      const allSchemasResults = await Promise.all(allSchemasPromises);

      const allSchemasData = allSchemasResults.flat();

      const processedData = processSchemaData(allSchemasData);
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

  return (
    <div>
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Schema</h1>
        <div className="flex items-center gap-2">
          <button
            className="p-1 px-1.5 rounded-lg border border-gray-400 hover:bg-gray-50 disabled:opacity-50"
            onClick={handleRefresh}
            disabled={loading}
          >
            <Icon
              icon="material-symbols:autorenew-rounded"
              width="24"
              height="24"
              className={`text-gray-600 ${loading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p>Loading data...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden mt-5">
          <table className="w-full">
            <thead>
              <tr className="bg-[#29304a] text-white">
                <th className="text-left p-4">ID</th>
                <th className="text-left p-4">Name</th>
                <th className="text-left p-4">Description</th>
                <th className="text-left p-4">Database</th>
                <th className="text-left p-4">Owner</th>
                <th className="text-left p-4">Tables</th>
                <th className="text-left p-4">Views</th>
                <th className="text-left p-4">Created Date</th>
                <th className="text-left p-4">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {schemaData.length > 0 ? schemaData.map((schema, index) => (
                <tr key={index} className="border-b">
                  <td className="p-4">{schema.id}</td>
                  <td className="p-4">{schema.connectionName}</td>
                  <td className="p-4">{schema.description}</td>
                  <td className="p-4">{schema.database}</td>
                  <td className="p-4">{schema.owner}</td>
                  <td className="p-4 text-gray-500 underline">{schema.tables}</td>
                  <td className="p-4 text-gray-500 underline">{schema.views}</td>
                  <td className="p-4">{schema.CreatedDate}</td>
                  <td className="p-4">{schema.lastUpdated}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="9" className="p-4 text-center">No schema data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Schema;