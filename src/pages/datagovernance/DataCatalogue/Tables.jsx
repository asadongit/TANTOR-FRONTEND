import React, { useState, useEffect } from "react";
import Breadcrumb from "../../../components/Breadcrumb";
import { Icon } from "@iconify-icon/react";
import { secureQuery } from './Components/function.js';
import { useAuth } from "../../../context/AuthContext.jsx";

function Tables() {
  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState([]);
  const { token } = useAuth();
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const fetchTableDetails = async (policyId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_FAST_API}/connection_details/${policyId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error(`Error fetching table details for policy ${policyId}:`, error);
      return [];
    }
  };

  const processTableData = (data) => {
    // Group by table
    const tableMap = new Map();

    data.forEach(item => {
      // Unique key for table
      const tableKey = `${item.connection_id}_${item.table_schema}_${item.table_name}`;

      if (!tableMap.has(tableKey)) {
        tableMap.set(tableKey, {
          id: `#${item.conn_metadata_id.substring(0, 4)}`,
          name: item.table_name,
          alias: item.table_name.substring(0, 2).toUpperCase(),
          description: `Table in ${item.connection_type} database`,
          schema: item.table_schema,
          database: item.connection_type,
          owner: item.created_by || 'System',
          column: 0,
          tags: getTags(item.connection_type),
          CreatedDate: new Date(item.created_at).toLocaleDateString(),
          lastUpdated: new Date(item.updated_at).toLocaleDateString(),
          selected: false
        });
      }

      const entry = tableMap.get(tableKey);

      // Count columns
      entry.column++;
    });

    // Convert map to array and format the counts
    return Array.from(tableMap.values()).map(item => ({
      ...item,
      column: item.column.toString().padStart(2, '0')
    }));
  };

  // Helper function to assign random tags
  const getTags = (connectionType) => {
    const tags = ['Sensitive', 'Critical', 'Internal', 'Public', 'Confidential'];
    const index = Math.floor(Math.random() * tags.length);
    return tags[index];
  };

  // Refactored loadData to return result for toast
  const loadData = async () => {
    setLoading(true);
    try {
      const secureQueryResponse = await secureQuery({
        user_query: "",
      }, token);

      const policyIds = secureQueryResponse.matched_policy_ids || [];

      const allTablesPromises = policyIds.map(id => fetchTableDetails(id));
      const allTablesResults = await Promise.all(allTablesPromises);

      const allTablesData = allTablesResults.flat();

      const processedData = processTableData(allTablesData);
      setTableData(processedData);
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

  // Refresh handler with toast
  const handleRefresh = async () => {
    const result = await loadData();
    if (result.success) {
      setToast({
        show: true,
        message: 'Table data refreshed successfully',
        type: 'success'
      });
    } else {
      setToast({
        show: true,
        message: 'Failed to refresh table data',
        type: 'error'
      });
    }
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Handle checkbox selection
  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;
    setTableData(tableData.map(item => ({ ...item, selected: isChecked })));
  };

  const handleSelectItem = (index) => {
    const updatedData = [...tableData];
    updatedData[index].selected = !updatedData[index].selected;
    setTableData(updatedData);
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
      <Breadcrumb title="Data Governance" link="/" />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Table</h1>
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#29304a] text-white">
                  <th className="text-left p-4">ID</th>
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Alias</th>
                  <th className="text-left p-4">Description</th>
                  <th className="text-left p-4">Schema</th>
                  <th className="text-left p-4">Database</th>
                  <th className="text-left p-4">Owner</th>
                  <th className="text-left p-4">Columns</th>
                  <th className="text-left p-4">Tags</th>
                  <th className="text-left p-4">Created Date</th>
                  <th className="text-left p-4">Last Updated</th>
                  <th className="text-left p-4">Action</th>
                  <th className="text-left p-4">
                    <input
                      type="checkbox"
                      name="selectAll"
                      onChange={handleSelectAll}
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableData.length > 0 ? tableData.map((table, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-4">{table.id}</td>
                    <td className="p-4">{table.name}</td>
                    <td className="p-4">{table.alias}</td>
                    <td className="p-4">{table.description}</td>
                    <td className="p-4">{table.schema}</td>
                    <td className="p-4">{table.database}</td>
                    <td className="p-4">{table.owner}</td>
                    <td className="p-4 text-gray-500 underline">{table.column}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        table.tags === 'Sensitive' ? 'bg-red-100 text-red-800' :
                        table.tags === 'Critical' ? 'bg-orange-100 text-orange-800' :
                        table.tags === 'Internal' ? 'bg-blue-100 text-blue-800' :
                        table.tags === 'Public' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {table.tags}
                      </span>
                    </td>
                    <td className="p-4">{table.CreatedDate}</td>
                    <td className="p-4">{table.lastUpdated}</td>
                    <td className="p-4">
                      <button className="text-blue-600 hover:underline">View</button>
                    </td>
                    <td className="p-4">
                      <input
                        type="checkbox"
                        name={`select-${index}`}
                        checked={table.selected || false}
                        onChange={() => handleSelectItem(index)}
                      />
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="13" className="p-4 text-center">No table data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tables;