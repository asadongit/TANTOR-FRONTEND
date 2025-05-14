import React, { useState, useEffect } from "react";
import Breadcrumb from "../../../components/Breadcrumb";
import { Icon } from "@iconify-icon/react";
import { secureQuery } from './Components/function.js';
import { useAuth } from "../../../context/AuthContext.jsx";

function Columns() {
  const [loading, setLoading] = useState(true);
  const [columnData, setColumnData] = useState([]);
  const { token } = useAuth();

  const fetchColumnDetails = async (policyId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_FAST_API}/connection_details/${policyId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error(`Error fetching column details for policy ${policyId}:`, error);
      return [];
    }
  };

  const processColumnData = (data) => {
    // Process columns directly
    return data.map(item => {
      const dataType = item.column_metadata ? item.column_metadata.DATA_TYPE || 'UNKNOWN' : 'UNKNOWN';
      const isNullable = item.column_metadata ? item.column_metadata.is_nullable === 'Y' : false;

      return {
        id: `#${item.conn_metadata_id.substring(0, 4)}`,
        name: item.column_name || 'Unnamed',
        table: item.table_name,
        schema: item.table_schema,
        dataType,
        nullable: isNullable ? 'Yes' : 'No',
        database: item.connection_type,
        diagram: Math.floor(Math.random() * 10) + 1, // Random number for demonstration
        joins: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toLocaleDateString(), // Random date within last 30 days
        selected: false
      };
    });
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const secureQueryResponse = await secureQuery({
          user_query: "",
        }, token);

        const policyIds = secureQueryResponse.matched_policy_ids || [];

        const allColumnsPromises = policyIds.map(id => fetchColumnDetails(id));
        const allColumnsResults = await Promise.all(allColumnsPromises);

        const allColumnsData = allColumnsResults.flat();

        const processedData = processColumnData(allColumnsData);
        setColumnData(processedData);
      } catch (error) {
        console.error('Error loading column data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  // Handle checkbox selection
  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;
    setColumnData(columnData.map(item => ({ ...item, selected: isChecked })));
  };

  const handleSelectItem = (index) => {
    const updatedData = [...columnData];
    updatedData[index].selected = !updatedData[index].selected;
    setColumnData(updatedData);
  };

  return (
    <div>
      <Breadcrumb title="Data Governance" link="/" />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Column</h1>
        <div className="flex items-center gap-2">
          <button
            className="p-1 px-1.5 rounded-lg border border-gray-400 hover:bg-gray-50"
            onClick={() => window.location.reload()}
          >
            <Icon
              icon="material-symbols:autorenew-rounded"
              width="24"
              height="24"
              className="text-gray-600"
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
                <th className="text-left p-4">Table</th>
                <th className="text-left p-4">Schema</th>
                <th className="text-left p-4">Data Type</th>
                <th className="text-left p-4">Nullable</th>
                <th className="text-left p-4">Database</th>
                <th className="text-left p-4">Diagram</th>
                <th className="text-left p-4">Joins</th>
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
              {columnData.length > 0 ? columnData.map((column, index) => (
                <tr key={index} className="border-b">
                  <td className="p-4">{column.id}</td>
                  <td className="p-4">{column.name}</td>
                  <td className="p-4">{column.table}</td>
                  <td className="p-4">{column.schema}</td>
                  <td className="p-4">{column.dataType}</td>
                  <td className="p-4">{column.nullable}</td>
                  <td className="p-4">{column.database}</td>
                  <td className="p-4 text-gray-500 underline">{column.diagram}</td>
                  <td className="p-4">{column.joins}</td>
                  <td className="p-4">
                    <button className="text-blue-600 hover:underline">View</button>
                  </td>
                  <td className="p-4">
                    <input
                      type="checkbox"
                      name={`select-${index}`}
                      checked={column.selected || false}
                      onChange={() => handleSelectItem(index)}
                    />
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="11" className="p-4 text-center">No column data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Columns;