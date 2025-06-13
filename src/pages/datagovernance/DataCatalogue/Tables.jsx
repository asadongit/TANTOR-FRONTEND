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
  const [showModal, setShowModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [allTablesRawData, setAllTablesRawData] = useState([]);

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
    const tableMap = new Map();

    data.forEach(item => {
      const tableKey = `${item.connection_id}_${item.table_schema}_${item.table_name}`;

      if (!tableMap.has(tableKey)) {
        tableMap.set(tableKey, {
          id: `#${item.conn_metadata_id.substring(0, 8)}`,
          name: item.table_name,
          description: `Table in ${item.connection_type} database`,
          schema: item.table_schema,
          database: item.connection_type,
          connection_name: item.connection_name,
          owner: item.created_by || 'System',
          project: item.project || 'default',
          is_migrated: item.is_migrated,
          is_purged: item.is_purged,
          is_virtualization: item.is_virtualization,
          cdc_enabled: item.cdc_enabled,
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
      const secureQueryResponse = await secureQuery({
        user_query: "",
      }, token);

      const policyIds = secureQueryResponse.matched_policy_ids || [];

      const allTablesPromises = policyIds.map(id => fetchTableDetails(id));
      const allTablesResults = await Promise.all(allTablesPromises);

      const allTablesData = allTablesResults.flat();
      setAllTablesRawData(allTablesData);

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
            <Icon icon="mdi:close" className="h-4 w-4" />
          </button>
        </div>
      )}

      {showModal && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] relative flex flex-col">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 z-10"
              onClick={() => setShowModal(false)}
            >
              <Icon icon="mdi:close" className="h-6 w-6" />
            </button>
            <div className="p-6 flex-shrink-0">
              <h2 className="text-xl font-semibold mb-2">Table Details</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="font-medium">Name:</div>
                    <div>{selectedTable.name}</div>
                  </div>
                  <div>
                    <div className="font-medium">Schema:</div>
                    <div>{selectedTable.schema}</div>
                  </div>
                  <div>
                    <div className="font-medium">Database:</div>
                    <div>{selectedTable.database}</div>
                  </div>
                  <div>
                    <div className="font-medium">Connection Name:</div>
                    <div>{selectedTable.connection_name}</div>
                  </div>
                  <div>
                    <div className="font-medium">Owner:</div>
                    <div>{selectedTable.owner}</div>
                  </div>
                  <div>
                    <div className="font-medium">Project:</div>
                    <div>{selectedTable.project}</div>
                  </div>
                  <div>
                    <div className="font-medium">Description:</div>
                    <div>{selectedTable.description}</div>
                  </div>
                  <div>
                    <div className="font-medium">Migrated:</div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      selectedTable.is_migrated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedTable.is_migrated ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">Purged:</div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      selectedTable.is_purged ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedTable.is_purged ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">Virtualization:</div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      selectedTable.is_virtualization ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedTable.is_virtualization ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">CDC Enabled:</div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      selectedTable.cdc_enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedTable.cdc_enabled ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">Created Date:</div>
                    <div>{selectedTable.CreatedDate}</div>
                  </div>
                  <div>
                    <div className="font-medium">Last Updated:</div>
                    <div>{selectedTable.lastUpdated}</div>
                  </div>
                </div>
              </div>
              <div>
                <div className="font-semibold mb-2">Columns</div>
                <div className="overflow-x-auto">
                  <table className="w-full border">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="text-left p-2 border">Column Name</th>
                        <th className="text-left p-2 border">Data Type</th>
                        <th className="text-left p-2 border">Nullable</th>
                        <th className="text-left p-2 border">Default</th>
                        <th className="text-left p-2 border">Length</th>
                        <th className="text-left p-2 border">Precision</th>
                        <th className="text-left p-2 border">Scale</th>
                        <th className="text-left p-2 border">Column Key</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getTableColumns(selectedTable).length > 0 ? getTableColumns(selectedTable).map((col, idx) => {
                        const meta = col.column_metadata || {};
                        return (
                          <tr key={idx}>
                            <td className="p-2 border">{col.column_name || '-'}</td>
                            <td className="p-2 border">{meta.DATA_TYPE || '-'}</td>
                            <td className="p-2 border">{meta.is_nullable || '-'}</td>
                            <td className="p-2 border">{meta.COLUMN_DEFAULT !== undefined && meta.COLUMN_DEFAULT !== null && meta.COLUMN_DEFAULT !== "null" ? meta.COLUMN_DEFAULT : '-'}</td>
                            <td className="p-2 border">{meta.DATA_LENGTH !== undefined && meta.DATA_LENGTH !== null && meta.DATA_LENGTH !== "null" ? meta.DATA_LENGTH : '-'}</td>
                            <td className="p-2 border">{meta.DATA_PRECISION !== undefined && meta.DATA_PRECISION !== null && meta.DATA_PRECISION !== "null" ? meta.DATA_PRECISION : '-'}</td>
                            <td className="p-2 border">{meta.DATA_SCALE !== undefined && meta.DATA_SCALE !== null && meta.DATA_SCALE !== "null" ? meta.DATA_SCALE : '-'}</td>
                            <td className="p-2 border">{meta.COLUMN_KEY !== undefined && meta.COLUMN_KEY !== null && meta.COLUMN_KEY !== "null" ? meta.COLUMN_KEY : '-'}</td>
                          </tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan="8" className="p-2 text-center">No column details available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Breadcrumb/>
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
                  <th className="text-left p-4">Description</th>
                  <th className="text-left p-4">Schema</th>
                  <th className="text-left p-4">Database</th>
                  {/* <th className="text-left p-4">Connection Name</th> */}
                  <th className="text-left p-4">Owner</th>
                  <th className="text-left p-4">Project</th>
                  <th className="text-left p-4">Columns</th>
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
                    <td className="p-4">{table.description}</td>
                    <td className="p-4">{table.schema}</td>
                    <td className="p-4">{table.database}</td>
                    {/* <td className="p-4">{table.connection_name}</td> */}
                    <td className="p-4">{table.owner}</td>
                    <td className="p-4">{table.project}</td>
                    <td className="p-4 text-blue-600 underline cursor-pointer">{table.column}</td>
                    <td className="p-4">{table.CreatedDate}</td>
                    <td className="p-4">{table.lastUpdated}</td>
                    <td className="p-4">
                      <button
                        className="text-blue-600 hover:underline"
                        onClick={() => {
                          setSelectedTable(table);
                          setShowModal(true);
                        }}
                      >
                        View
                      </button>
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